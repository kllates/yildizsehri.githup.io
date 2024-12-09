const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('canvas'),
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x0a192f);

        // DNA structure
        const dnaStrands = [];
        const strandCount = 2;
        const particlesPerStrand = 100;
        let baseRadius = 10;
        const height = 200;

        function createDNAStructure() {
            // Clear existing strands
            dnaStrands.forEach(strand => {
                strand.forEach(object => {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) object.material.dispose();
                    scene.remove(object);
                });
            });
            dnaStrands.length = 0;

            for (let s = 0; s < strandCount; s++) {
                const strand = [];
                for (let i = 0; i < particlesPerStrand; i++) {
                    const sphereGeo = new THREE.SphereGeometry(0.3, 8, 8);
                    const sphereMat = new THREE.MeshPhongMaterial({
                        color: i % 2 === 0 ? 0x64ffda : 0x8892b0,
                        emissive: i % 2 === 0 ? 0x64ffda : 0x8892b0,
                        emissiveIntensity: 0.5
                    });
                    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
                    scene.add(sphere);
                    strand.push(sphere);

                    if (i < particlesPerStrand - 1) {
                        const lineGeo = new THREE.BufferGeometry();
                        const lineMat = new THREE.LineBasicMaterial({ 
                            color: 0x64ffda,
                            transparent: true,
                            opacity: 0.5
                        });
                        const line = new THREE.Line(lineGeo, lineMat);
                        scene.add(line);
                        strand.push(line);
                    }

                    // Add cross-connections between strands
                    if (s === 1 && i % 4 === 0) {
                        const connectionGeo = new THREE.BufferGeometry();
                        const connectionMat = new THREE.LineBasicMaterial({
                            color: 0x64ffda,
                            transparent: true,
                            opacity: 0.3
                        });
                        const connection = new THREE.Line(connectionGeo, connectionMat);
                        scene.add(connection);
                        strand.push(connection);
                    }
                }
                dnaStrands.push(strand);
            }
        }

        createDNAStructure();

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x64ffda, 1, 100);
        pointLight1.position.set(10, 10, 10);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x8892b0, 1, 100);
        pointLight2.position.set(-10, -10, -10);
        scene.add(pointLight2);

        camera.position.z = 30;

        let scrollPercent = 0;
        document.addEventListener('scroll', () => {
            const h = document.documentElement,
                  b = document.body,
                  st = 'scrollTop',
                  sh = 'scrollHeight';
            scrollPercent = (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight);
        });

        const cursor = document.querySelector('.custom-cursor');
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX - 10 + 'px';
            cursor.style.top = e.clientY - 10 + 'px';
        });

        function updateDNA(time) {
            const baseOffset = scrollPercent * height;
            const expandedRadius = baseRadius + (scrollPercent * 15);
            
            dnaStrands.forEach((strand, strandIndex) => {
                const offset = (strandIndex * Math.PI) + time;
                let lastSpherePos;
                
                strand.forEach((object, i) => {
                    if (object instanceof THREE.Mesh) {
                        const particleIndex = Math.floor(i / 2);
                        const y = (particleIndex - particlesPerStrand / 2) * 2 + baseOffset;
                        const angle = (particleIndex * 0.5) + offset;
                        
                        object.position.x = Math.cos(angle) * expandedRadius;
                        object.position.y = y;
                        object.position.z = Math.sin(angle) * expandedRadius;
                        
                        lastSpherePos = object.position.clone();
                    } else if (object instanceof THREE.Line) {
                        if (strandIndex === 1 && i % 8 === 6) {
                            // This is a cross-connection
                            const positions = new Float32Array([
                                lastSpherePos.x, lastSpherePos.y, lastSpherePos.z,
                                -lastSpherePos.x, lastSpherePos.y, -lastSpherePos.z
                            ]);
                            object.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                        } else {
                            // This is a regular connection within the strand
                            const particleIndex = Math.floor(i / 2);
                            const nextParticleIndex = particleIndex + 1;
                            
                            const y1 = (particleIndex - particlesPerStrand / 2) * 2 + baseOffset;
                            const y2 = (nextParticleIndex - particlesPerStrand / 2) * 2 + baseOffset;
                            
                            const angle1 = (particleIndex * 0.5) + offset;
                            const angle2 = (nextParticleIndex * 0.5) + offset;
                            
                            const x1 = Math.cos(angle1) * expandedRadius;
                            const z1 = Math.sin(angle1) * expandedRadius;
                            const x2 = Math.cos(angle2) * expandedRadius;
                            const z2 = Math.sin(angle2) * expandedRadius;
                            
                            const positions = new Float32Array([
                                x1, y1, z1,
                                x2, y2, z2
                            ]);
                            object.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                        }
                    }
                });
            });

            // Update camera based on scroll
            camera.position.z = 30 + (scrollPercent * 20);
        }

        function animate(time) {
            requestAnimationFrame(animate);
            const t = time * 0.001;
            updateDNA(t);
            renderer.render(scene, camera);
        }

        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });