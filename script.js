// Интерактивность для табов с кейсами
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.case-study-panel');

tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Сначала убираем класс tab-active у всех вкладок и панелей
        tabs.forEach(t => t.classList.remove('tab-active'));
        panels.forEach(p => p.classList.remove('tab-active'));
        
        // Затем добавляем класс tab-active к нажатой вкладке
        tab.classList.add('tab-active');
        
        // И к соответствующей ей панели
        const targetPanelId = tab.getAttribute('data-tab');
        const targetPanel = document.querySelector(`.case-study-panel[data-tab="${targetPanelId}"]`);
        if (targetPanel) {
            targetPanel.classList.add('tab-active');
        }
    });
});

// Плавная прокрутка для навигации
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Анимация появления элементов при скролле
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Применяем анимацию только к feature-card (убрали case-study-card)
document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Neural Network Animation
function initNeuralNetwork() {
    const N = 200;                   // Optimized number of points
    const NEIGHBORS = 5;             // Increased for denser connections
    const MIN_WALKERS = 1;
    const MAX_WALKERS = 3;
    const MAX_VISITED = 2;
    const delay = 100;

    // Seeded random number generator для фиксированных позиций
    function seededRandom(seed) {
        let state = seed;
        return function() {
            state = (state * 9301 + 49297) % 233280;
            return state / 233280;
        };
    }
    
    const fixedRandom = seededRandom(12345); // Фиксированный seed
    
    // ВАЖНО: fixedRandom используется только для генерации позиций узлов
    // Math.random() используется для анимации walker'ов (чтобы сохранить динамичность)

    const svg = document.getElementById('network-svg');
    const container = document.getElementById('wrapper');
    const brainPath = document.getElementById('brainPath');
    
    if (!svg || !container) return; // Exit if elements not found

    const W = +svg.getAttribute('width');
    const H = +svg.getAttribute('height');

    // Generate evenly distributed points inside ellipse
    function generateEllipsePoints(rows, cols) {
        const pts = [];
        const centerX = 400;
        const centerY = 300;
        const radiusX = 280;
        const radiusY = 200;
        
        // Create more uniform grid with slight randomization
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Normalize coordinates to [-1, 1]
                const normalizedX = (c / (cols - 1)) * 2 - 1;
                const normalizedY = (r / (rows - 1)) * 2 - 1;
                
                // Check if point is inside ellipse
                if ((normalizedX * normalizedX) + (normalizedY * normalizedY) <= 1) {
                    // Add small random offset for natural look
                    const offsetX = (fixedRandom() - 0.5) * 0.3;
                    const offsetY = (fixedRandom() - 0.5) * 0.3;
                    
                    const x = centerX + (normalizedX + offsetX) * radiusX * 0.9;
                    const y = centerY + (normalizedY + offsetY) * radiusY * 0.9;
                    
                    pts.push({ x, y });
                }
            }
        }
        return pts;
    }

    const gridPts = generateEllipsePoints(18, 24);  // Increased density, more horizontal
    const nodes = gridPts.slice(0, N).map((p, i) => ({ id: i, x: p.x, y: p.y }));
    
    // Fill remaining nodes if needed with ellipse check
    const centerX = 400, centerY = 300, radiusX = 280, radiusY = 200;
    let attempts = 0;
    while (nodes.length < N && attempts < N * 2) {
        const angle = fixedRandom() * Math.PI * 2;
        const radius = Math.sqrt(fixedRandom()) * 0.9; // Square root for uniform distribution
        const x = centerX + radius * radiusX * Math.cos(angle);
        const y = centerY + radius * radiusY * Math.sin(angle);
        nodes.push({ id: nodes.length, x, y });
        attempts++;
    }

    // Build adjacency list by proximity
    const adj = Array.from({ length: N }, () => []);
    nodes.forEach((a, i) => {
        const dists = nodes.map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }));
        dists.sort((u, v) => u.d - v.d);
        for (let k = 1; k <= NEIGHBORS; k++) {
            const j = dists[k].j;
            adj[i].push(j);
            adj[j].push(i);
        }
    });

    // Draw edges
    const drawn = new Set();
    adj.forEach((nb, i) => nb.forEach(j => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!drawn.has(key)) {
            drawn.add(key);
            const a = nodes[i], b = nodes[j];
            const line = document.createElementNS(svg.namespaceURI, 'line');
            line.setAttribute('class', 'edge');
            line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
            line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
            container.appendChild(line);
        }
    }));

    // Draw nodes
    nodes.forEach(n => {
        const circle = document.createElementNS(svg.namespaceURI, 'circle');
        circle.setAttribute('id', `n${n.id}`);
        circle.setAttribute('class', 'node');
        circle.setAttribute('cx', n.x);
        circle.setAttribute('cy', n.y);
        circle.setAttribute('r', 2.5);
        container.appendChild(circle);
    });

    // Walker class for multiple signals
    class Walker {
        constructor() {
            this.current = Math.floor(Math.random() * N);
            this.prev = null;
            this.history = [];
            this.stepsLeft = Walker.randomSteps();
            this.alive = true;
            this.animate();
        }
        static randomSteps() { return Math.floor(Math.random() * 30) + 10; } // Reduced range
        animate() {
            if (!this.alive) return;
            const idx = this.current;
            const el = document.getElementById(`n${idx}`);
            if (!el) return; // Safety check
            el.classList.add('active');
            setTimeout(() => {
                if (!this.alive) return; // Check again after timeout
                el.classList.remove('active'); 
                el.classList.add('visited');
                this.history.push(idx);
                if (this.history.length > MAX_VISITED) {
                    const old = this.history.shift();
                    const oldEl = document.getElementById(`n${old}`);
                    if (oldEl) oldEl.classList.remove('visited');
                }
                this.stepsLeft--;
                let next;
                if (this.stepsLeft <= 0) {
                    next = Math.floor(Math.random() * N);
                    this.stepsLeft = Walker.randomSteps();
                } else {
                    let choices = adj[idx].filter(v => v !== this.prev);
                    if (!choices.length) choices = adj[idx];
                    next = choices[Math.floor(Math.random() * choices.length)];
                }
                this.prev = idx; this.current = next;
                requestAnimationFrame(() => this.animate()); // Use RAF instead of setTimeout
            }, delay);
        }
        kill() { this.alive = false; }
    }

    // Manage random walkers count
    const walkers = [];
    function syncWalkers() {
        const target = Math.floor(Math.random() * (MAX_WALKERS - MIN_WALKERS + 1)) + MIN_WALKERS;
        // Clean up dead walkers first
        for (let i = walkers.length - 1; i >= 0; i--) {
            if (!walkers[i].alive) walkers.splice(i, 1);
        }
        while (walkers.length > target) {
            const walker = walkers.pop();
            if (walker) walker.kill();
        }
        while (walkers.length < target) walkers.push(new Walker());
        setTimeout(syncWalkers, delay * 60); // Increased interval
    }

    // Start the animation
    syncWalkers();
}

// Initialize neural network when DOM is loaded
document.addEventListener('DOMContentLoaded', initNeuralNetwork); 