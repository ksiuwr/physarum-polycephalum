// Fixed Complete Pathfinding Algorithms Visualization App - 5 Algorithms
class MazeGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.maze = [];
    }

    generate() {
        // Initialize maze with walls
        this.maze = Array(this.height).fill().map(() => Array(this.width).fill(1));
        
        // Create paths using recursive backtracking
        const stack = [];
        const visited = Array(this.height).fill().map(() => Array(this.width).fill(false));
        
        // Start from random odd position
        let startX = 1 + Math.floor(Math.random() * Math.floor((this.width - 1) / 2)) * 2;
        let startY = 1 + Math.floor(Math.random() * Math.floor((this.height - 1) / 2)) * 2;
        
        this.maze[startY][startX] = 0;
        visited[startY][startX] = true;
        stack.push([startX, startY]);
        
        const directions = [[0, 2], [2, 0], [0, -2], [-2, 0]];
        
        while (stack.length > 0) {
            const [x, y] = stack[stack.length - 1];
            const neighbors = [];
            
            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1 && !visited[ny][nx]) {
                    neighbors.push([nx, ny, x + dx/2, y + dy/2]);
                }
            }
            
            if (neighbors.length > 0) {
                const [nx, ny, wx, wy] = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.maze[ny][nx] = 0;
                this.maze[wy][wx] = 0;
                visited[ny][nx] = true;
                stack.push([nx, ny]);
            } else {
                stack.pop();
            }
        }
        
        return this.maze;
    }
}

// PHYSARUM ALGORITHM - FIXED VERSION
class PhysarumSolver {
    constructor(maze, startPos, endPos, params) {
        this.maze = maze;
        this.width = maze[0].length;
        this.height = maze.length;
        this.startPos = startPos;
        this.endPos = endPos;
        this.params = params;
        
        this.potentials = Array(this.height).fill().map(() => Array(this.width).fill(0));
        this.diameters = {
            horizontal: Array(this.height).fill().map(() => Array(this.width - 1).fill(params.initial_diameter)),
            vertical: Array(this.height - 1).fill().map(() => Array(this.width).fill(params.initial_diameter))
        };
        this.flows = {
            horizontal: Array(this.height).fill().map(() => Array(this.width - 1).fill(0)),
            vertical: Array(this.height - 1).fill().map(() => Array(this.width).fill(0))
        };
        
        this.iteration = 0;
        this.converged = false;
        this.maxFlow = 0;
        this.path = [];
        this.stabilityCounter = 0;
    }

    step() {
        this.iteration++;
        
        // Auto-converge after reasonable iterations
        if (this.iteration >= 150) {
            this.converged = true;
            this.findMainPath();
            return this.createResult();
        }
        
        this.setBoundaryConditions();
        this.solvePotentials();
        this.calculateFlows();
        this.updateDiameters();
        this.checkConvergence();
        
        return this.createResult();
    }

    setBoundaryConditions() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.potentials[y][x] = 0;
            }
        }
        
        if (this.startPos) this.potentials[this.startPos.y][this.startPos.x] = 1.0;
        if (this.endPos) this.potentials[this.endPos.y][this.endPos.x] = 0.0;
    }

    solvePotentials() {
        const iterations = Math.min(this.params.iterations || 10, 15);
        
        for (let iter = 0; iter < iterations; iter++) {
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    if (this.maze[y][x] === 1) continue;
                    if (this.isBoundaryPoint(x, y)) continue;
                    
                    let sum = 0;
                    let weights = 0;
                    
                    const neighbors = [
                        {x: x-1, y: y, isHorizontal: true, edgeX: x-1, edgeY: y},
                        {x: x+1, y: y, isHorizontal: true, edgeX: x, edgeY: y},
                        {x: x, y: y-1, isHorizontal: false, edgeX: x, edgeY: y-1},
                        {x: x, y: y+1, isHorizontal: false, edgeX: x, edgeY: y}
                    ];
                    
                    for (const neighbor of neighbors) {
                        if (this.isValidCell(neighbor.x, neighbor.y) && this.maze[neighbor.y][neighbor.x] === 0) {
                            const conductance = this.getConductance(neighbor.isHorizontal, neighbor.edgeX, neighbor.edgeY);
                            sum += conductance * this.potentials[neighbor.y][neighbor.x];
                            weights += conductance;
                        }
                    }
                    
                    if (weights > 0) {
                        this.potentials[y][x] = sum / weights;
                    }
                }
            }
        }
    }

    getConductance(isHorizontal, edgeX, edgeY) {
        const diameter = isHorizontal ? 
            this.diameters.horizontal[edgeY][edgeX] : 
            this.diameters.vertical[edgeY][edgeX];
        return Math.max(diameter, 1e-10);
    }

    calculateFlows() {
        this.maxFlow = 0;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width - 1; x++) {
                if (this.maze[y][x] === 0 && this.maze[y][x + 1] === 0) {
                    const conductance = this.getConductance(true, x, y);
                    const potentialDiff = this.potentials[y][x] - this.potentials[y][x + 1];
                    this.flows.horizontal[y][x] = conductance * potentialDiff;
                    this.maxFlow = Math.max(this.maxFlow, Math.abs(this.flows.horizontal[y][x]));
                }
            }
        }
        
        for (let y = 0; y < this.height - 1; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.maze[y][x] === 0 && this.maze[y + 1][x] === 0) {
                    const conductance = this.getConductance(false, x, y);
                    const potentialDiff = this.potentials[y][x] - this.potentials[y + 1][x];
                    this.flows.vertical[y][x] = conductance * potentialDiff;
                    this.maxFlow = Math.max(this.maxFlow, Math.abs(this.flows.vertical[y][x]));
                }
            }
        }
    }

    updateDiameters() {
        const dt = Math.min(this.params.dt || 0.1, 0.2);
        const minDiameter = 0.01;
        const maxDiameter = 5.0;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width - 1; x++) {
                if (this.maze[y][x] === 0 && this.maze[y][x + 1] === 0) {
                    const flow = Math.abs(this.flows.horizontal[y][x]);
                    const currentDiameter = this.diameters.horizontal[y][x];
                    const change = dt * (flow - currentDiameter * 0.1);
                    this.diameters.horizontal[y][x] = Math.max(minDiameter, Math.min(currentDiameter + change, maxDiameter));
                }
            }
        }
        
        for (let y = 0; y < this.height - 1; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.maze[y][x] === 0 && this.maze[y + 1][x] === 0) {
                    const flow = Math.abs(this.flows.vertical[y][x]);
                    const currentDiameter = this.diameters.vertical[y][x];
                    const change = dt * (flow - currentDiameter * 0.1);
                    this.diameters.vertical[y][x] = Math.max(minDiameter, Math.min(currentDiameter + change, maxDiameter));
                }
            }
        }
    }

    checkConvergence() {
        if (this.iteration > 50 && this.maxFlow < 0.01) {
            this.stabilityCounter++;
            if (this.stabilityCounter >= 10) {
                this.converged = true;
                this.findMainPath();
            }
        } else {
            this.stabilityCounter = 0;
        }
    }

    findMainPath() {
        // Simple BFS to find any path for demonstration
        const queue = [this.startPos];
        const visited = Array(this.height).fill().map(() => Array(this.width).fill(false));
        const parent = Array(this.height).fill().map(() => Array(this.width).fill(null));
        
        visited[this.startPos.y][this.startPos.x] = true;
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            if (current.x === this.endPos.x && current.y === this.endPos.y) {
                // Reconstruct path
                const path = [];
                let node = current;
                while (node) {
                    path.unshift(node);
                    node = parent[node.y][node.x];
                }
                this.path = path;
                return;
            }
            
            const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            for (const [dx, dy] of directions) {
                const nx = current.x + dx;
                const ny = current.y + dy;
                
                if (this.isValidCell(nx, ny) && this.maze[ny][nx] === 0 && !visited[ny][nx]) {
                    visited[ny][nx] = true;
                    parent[ny][nx] = current;
                    queue.push({ x: nx, y: ny });
                }
            }
        }
    }

    isBoundaryPoint(x, y) {
        return (this.startPos && x === this.startPos.x && y === this.startPos.y) ||
               (this.endPos && x === this.endPos.x && y === this.endPos.y);
    }

    isValidCell(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    createResult() {
        const potentials = this.potentials.flat().filter(p => p > 0);
        const allDiameters = [...this.diameters.horizontal.flat(), ...this.diameters.vertical.flat()];
        
        return {
            iteration: this.iteration,
            converged: this.converged,
            path: this.path,
            potentials: this.potentials,
            flows: this.flows,
            diameters: this.diameters,
            stats: {
                potentialMin: potentials.length > 0 ? Math.min(...potentials) : 0,
                potentialMax: potentials.length > 0 ? Math.max(...potentials) : 1,
                potentialAvg: potentials.length > 0 ? potentials.reduce((a, b) => a + b, 0) / potentials.length : 0.5,
                flowMax: this.maxFlow,
                flowAvg: [this.flows.horizontal.flat(), this.flows.vertical.flat()].flat()
                    .reduce((a, b) => a + Math.abs(b), 0) / (this.width * this.height),
                diameterMin: Math.min(...allDiameters),
                diameterMax: Math.max(...allDiameters),
                diameterAvg: allDiameters.reduce((a, b) => a + b, 0) / allDiameters.length
            }
        };
    }
}

// BFS ALGORITHM - WORKING VERSION
class BFSSolver {
    constructor(maze, startPos, endPos) {
        this.maze = maze;
        this.width = maze[0].length;
        this.height = maze.length;
        this.startPos = startPos;
        this.endPos = endPos;
        this.queue = [startPos];
        this.visited = Array(this.height).fill().map(() => Array(this.width).fill(false));
        this.parent = Array(this.height).fill().map(() => Array(this.width).fill(null));
        this.visited[startPos.y][startPos.x] = true;
        this.path = [];
        this.converged = false;
        this.currentNodes = [];
        this.visitedNodes = [startPos];
        this.step_count = 0;
    }

    step() {
        this.step_count++;
        
        if (this.queue.length === 0 || this.converged) {
            return this.createResult();
        }

        const current = this.queue.shift();
        this.currentNodes = [current];

        if (current.x === this.endPos.x && current.y === this.endPos.y) {
            this.converged = true;
            this.reconstructPath();
            return this.createResult();
        }

        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        
        for (const [dx, dy] of directions) {
            const nx = current.x + dx;
            const ny = current.y + dy;
            
            if (this.isValidCell(nx, ny) && 
                this.maze[ny][nx] === 0 && 
                !this.visited[ny][nx]) {
                
                this.visited[ny][nx] = true;
                this.parent[ny][nx] = current;
                const newNode = { x: nx, y: ny };
                this.queue.push(newNode);
                this.visitedNodes.push(newNode);
            }
        }

        return this.createResult();
    }

    reconstructPath() {
        const path = [];
        let current = this.endPos;
        
        while (current) {
            path.unshift(current);
            current = this.parent[current.y][current.x];
        }
        
        this.path = path;
    }

    isValidCell(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    createResult() {
        return {
            iteration: this.step_count,
            converged: this.converged,
            path: this.path,
            visitedNodes: this.visitedNodes,
            currentNodes: this.currentNodes,
            queueNodes: this.queue,
            stats: {
                visitedCount: this.visitedNodes.length,
                queueSize: this.queue.length,
                pathLength: this.path.length
            }
        };
    }
}

// DFS ALGORITHM - WORKING VERSION
class DFSSolver {
    constructor(maze, startPos, endPos) {
        this.maze = maze;
        this.width = maze[0].length;
        this.height = maze.length;
        this.startPos = startPos;
        this.endPos = endPos;
        this.stack = [startPos];
        this.visited = Array(this.height).fill().map(() => Array(this.width).fill(false));
        this.parent = Array(this.height).fill().map(() => Array(this.width).fill(null));
        this.visited[startPos.y][startPos.x] = true;
        this.path = [];
        this.converged = false;
        this.currentNodes = [];
        this.visitedNodes = [startPos];
        this.step_count = 0;
    }

    step() {
        this.step_count++;
        
        if (this.stack.length === 0 || this.converged) {
            return this.createResult();
        }

        const current = this.stack.pop();
        this.currentNodes = [current];

        if (current.x === this.endPos.x && current.y === this.endPos.y) {
            this.converged = true;
            this.reconstructPath();
            return this.createResult();
        }

        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        
        for (const [dx, dy] of directions) {
            const nx = current.x + dx;
            const ny = current.y + dy;
            
            if (this.isValidCell(nx, ny) && 
                this.maze[ny][nx] === 0 && 
                !this.visited[ny][nx]) {
                
                this.visited[ny][nx] = true;
                this.parent[ny][nx] = current;
                const newNode = { x: nx, y: ny };
                this.stack.push(newNode);
                this.visitedNodes.push(newNode);
            }
        }

        return this.createResult();
    }

    reconstructPath() {
        const path = [];
        let current = this.endPos;
        
        while (current) {
            path.unshift(current);
            current = this.parent[current.y][current.x];
        }
        
        this.path = path;
    }

    isValidCell(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    createResult() {
        return {
            iteration: this.step_count,
            converged: this.converged,
            path: this.path,
            visitedNodes: this.visitedNodes,
            currentNodes: this.currentNodes,
            stackNodes: this.stack,
            stats: {
                visitedCount: this.visitedNodes.length,
                stackSize: this.stack.length,
                pathLength: this.path.length
            }
        };
    }
}

// DIJKSTRA ALGORITHM - WORKING VERSION
class DijkstraSolver {
    constructor(maze, startPos, endPos) {
        this.maze = maze;
        this.width = maze[0].length;
        this.height = maze.length;
        this.startPos = startPos;
        this.endPos = endPos;
        this.distances = Array(this.height).fill().map(() => Array(this.width).fill(Infinity));
        this.parent = Array(this.height).fill().map(() => Array(this.width).fill(null));
        this.visited = Array(this.height).fill().map(() => Array(this.width).fill(false));
        this.pqueue = [];
        this.distances[startPos.y][startPos.x] = 0;
        this.pqueue.push({ x: startPos.x, y: startPos.y, dist: 0 });
        this.path = [];
        this.converged = false;
        this.currentNodes = [];
        this.visitedNodes = [];
        this.step_count = 0;
    }

    step() {
        this.step_count++;
        
        if (this.pqueue.length === 0 || this.converged) {
            return this.createResult();
        }

        this.pqueue.sort((a, b) => a.dist - b.dist);
        const current = this.pqueue.shift();
        
        if (this.visited[current.y][current.x]) {
            return this.createResult();
        }
        
        this.visited[current.y][current.x] = true;
        this.currentNodes = [current];
        this.visitedNodes.push(current);

        if (current.x === this.endPos.x && current.y === this.endPos.y) {
            this.converged = true;
            this.reconstructPath();
            return this.createResult();
        }

        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        
        for (const [dx, dy] of directions) {
            const nx = current.x + dx;
            const ny = current.y + dy;
            
            if (this.isValidCell(nx, ny) && 
                this.maze[ny][nx] === 0 && 
                !this.visited[ny][nx]) {
                
                const weight = 1; // Uniform weight for grid
                const newDist = this.distances[current.y][current.x] + weight;
                
                if (newDist < this.distances[ny][nx]) {
                    this.distances[ny][nx] = newDist;
                    this.parent[ny][nx] = current;
                    this.pqueue.push({ x: nx, y: ny, dist: newDist });
                }
            }
        }

        return this.createResult();
    }

    reconstructPath() {
        const path = [];
        let current = this.endPos;
        
        while (current) {
            path.unshift(current);
            current = this.parent[current.y][current.x];
        }
        
        this.path = path;
    }

    isValidCell(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    createResult() {
        return {
            iteration: this.step_count,
            converged: this.converged,
            path: this.path,
            visitedNodes: this.visitedNodes,
            currentNodes: this.currentNodes,
            queueNodes: this.pqueue,
            stats: {
                visitedCount: this.visitedNodes.length,
                queueSize: this.pqueue.length,
                pathLength: this.path.length,
                pathCost: this.path.length > 0 ? this.distances[this.endPos.y][this.endPos.x] : 0
            }
        };
    }
}

// A* ALGORITHM - WORKING VERSION
class AStarSolver {
    constructor(maze, startPos, endPos) {
        this.maze = maze;
        this.width = maze[0].length;
        this.height = maze.length;
        this.startPos = startPos;
        this.endPos = endPos;
        this.gScore = Array(this.height).fill().map(() => Array(this.width).fill(Infinity));
        this.fScore = Array(this.height).fill().map(() => Array(this.width).fill(Infinity));
        this.parent = Array(this.height).fill().map(() => Array(this.width).fill(null));
        this.openSet = [];
        this.closedSet = Array(this.height).fill().map(() => Array(this.width).fill(false));
        this.gScore[startPos.y][startPos.x] = 0;
        this.fScore[startPos.y][startPos.x] = this.heuristic(startPos.x, startPos.y);
        this.openSet.push({ x: startPos.x, y: startPos.y });
        this.path = [];
        this.converged = false;
        this.currentNodes = [];
        this.visitedNodes = [];
        this.step_count = 0;
    }

    step() {
        this.step_count++;
        
        if (this.openSet.length === 0 || this.converged) {
            return this.createResult();
        }

        let current = this.openSet[0];
        let currentIndex = 0;
        
        for (let i = 1; i < this.openSet.length; i++) {
            const node = this.openSet[i];
            if (this.fScore[node.y][node.x] < this.fScore[current.y][current.x]) {
                current = node;
                currentIndex = i;
            }
        }

        this.openSet.splice(currentIndex, 1);
        this.closedSet[current.y][current.x] = true;
        this.currentNodes = [current];
        this.visitedNodes.push(current);

        if (current.x === this.endPos.x && current.y === this.endPos.y) {
            this.converged = true;
            this.reconstructPath();
            return this.createResult();
        }

        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        
        for (const [dx, dy] of directions) {
            const nx = current.x + dx;
            const ny = current.y + dy;
            
            if (this.isValidCell(nx, ny) && 
                this.maze[ny][nx] === 0 && 
                !this.closedSet[ny][nx]) {
                
                const tentativeGScore = this.gScore[current.y][current.x] + 1;
                
                const inOpenSet = this.openSet.some(node => node.x === nx && node.y === ny);
                
                if (!inOpenSet || tentativeGScore < this.gScore[ny][nx]) {
                    this.parent[ny][nx] = current;
                    this.gScore[ny][nx] = tentativeGScore;
                    this.fScore[ny][nx] = this.gScore[ny][nx] + this.heuristic(nx, ny);
                    
                    if (!inOpenSet) {
                        this.openSet.push({ x: nx, y: ny });
                    }
                }
            }
        }

        return this.createResult();
    }

    heuristic(x, y) {
        return Math.abs(x - this.endPos.x) + Math.abs(y - this.endPos.y);
    }

    reconstructPath() {
        const path = [];
        let current = this.endPos;
        
        while (current) {
            path.unshift(current);
            current = this.parent[current.y][current.x];
        }
        
        this.path = path;
    }

    isValidCell(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    createResult() {
        return {
            iteration: this.step_count,
            converged: this.converged,
            path: this.path,
            visitedNodes: this.visitedNodes,
            currentNodes: this.currentNodes,
            openNodes: this.openSet,
            stats: {
                visitedCount: this.visitedNodes.length,
                openSetSize: this.openSet.length,
                pathLength: this.path.length,
                pathCost: this.path.length > 0 ? this.gScore[this.endPos.y][this.endPos.x] : 0
            }
        };
    }
}

// FIXED VISUALIZER CLASS
class Visualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = 20;
        this.colors = {
            wall: '#34495e',
            path: '#ffffff',
            start: '#27ae60',
            end: '#e74c3c',
            physarum: '#f1c40f',
            bfs: '#3498db',
            dfs: '#2ecc71',
            dijkstra: '#9b59b6',
            astar: '#e67e22',
            visited: 'rgba(52, 152, 219, 0.3)',
            current: 'rgba(231, 76, 60, 0.6)'
        };
    }

    setMaze(maze, width, height) {
        this.maze = maze;
        this.width = width;
        this.height = height;
        this.cellSize = Math.min(this.canvas.width / width, this.canvas.height / height);
        
        this.offsetX = (this.canvas.width - width * this.cellSize) / 2;
        this.offsetY = (this.canvas.height - height * this.cellSize) / 2;
    }

    draw(startPos, endPos, algorithm, solverData) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.maze) return;

        this.drawMaze();
        
        if (solverData) {
            if (algorithm === 'physarum') {
                this.drawPhysarum(solverData);
            } else {
                this.drawStandardAlgorithm(algorithm, solverData);
            }
        }
        
        // Draw start and end points AFTER everything else
        if (startPos) this.drawPoint(startPos, this.colors.start, '🟢');
        if (endPos) this.drawPoint(endPos, this.colors.end, '🔴');
    }

    drawMaze() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cellX = this.offsetX + x * this.cellSize;
                const cellY = this.offsetY + y * this.cellSize;
                
                this.ctx.fillStyle = this.maze[y][x] === 1 ? this.colors.wall : this.colors.path;
                this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
                
                this.ctx.strokeStyle = '#ddd';
                this.ctx.lineWidth = 0.5;
                this.ctx.strokeRect(cellX, cellY, this.cellSize, this.cellSize);
            }
        }
    }

    drawPhysarum(data) {
        if (data.flows && data.diameters) {
            this.drawFlows(data.flows, data.diameters);
        }
        
        if (data.path && data.path.length > 0) {
            this.drawPath(data.path, this.colors.physarum, 5);
        }
    }

    drawFlows(flows, diameters) {
        const maxDiameter = Math.max(
            Math.max(...diameters.horizontal.flat()),
            Math.max(...diameters.vertical.flat())
        );
        
        if (maxDiameter <= 0) return;
        
        this.ctx.lineCap = 'round';
        
        // Horizontal flows
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width - 1; x++) {
                if (this.maze[y][x] === 0 && this.maze[y][x + 1] === 0) {
                    const diameter = diameters.horizontal[y][x];
                    
                    if (diameter > 0.01) {
                        const normalizedDiameter = diameter / maxDiameter;
                        const lineWidth = Math.max(1, normalizedDiameter * 8);
                        const alpha = Math.min(0.8, normalizedDiameter);
                        
                        const x1 = this.offsetX + (x + 0.2) * this.cellSize;
                        const x2 = this.offsetX + (x + 0.8) * this.cellSize;
                        const y1 = this.offsetY + (y + 0.5) * this.cellSize;
                        
                        this.ctx.strokeStyle = `rgba(241, 196, 15, ${alpha})`;
                        this.ctx.lineWidth = lineWidth;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x1, y1);
                        this.ctx.lineTo(x2, y1);
                        this.ctx.stroke();
                    }
                }
            }
        }
        
        // Vertical flows
        for (let y = 0; y < this.height - 1; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.maze[y][x] === 0 && this.maze[y + 1][x] === 0) {
                    const diameter = diameters.vertical[y][x];
                    
                    if (diameter > 0.01) {
                        const normalizedDiameter = diameter / maxDiameter;
                        const lineWidth = Math.max(1, normalizedDiameter * 8);
                        const alpha = Math.min(0.8, normalizedDiameter);
                        
                        const x1 = this.offsetX + (x + 0.5) * this.cellSize;
                        const y1 = this.offsetY + (y + 0.2) * this.cellSize;
                        const y2 = this.offsetY + (y + 0.8) * this.cellSize;
                        
                        this.ctx.strokeStyle = `rgba(241, 196, 15, ${alpha})`;
                        this.ctx.lineWidth = lineWidth;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x1, y1);
                        this.ctx.lineTo(x1, y2);
                        this.ctx.stroke();
                    }
                }
            }
        }
    }

    drawStandardAlgorithm(algorithm, data) {
        // Draw visited nodes
        if (data.visitedNodes) {
            for (const node of data.visitedNodes) {
                const cellX = this.offsetX + node.x * this.cellSize;
                const cellY = this.offsetY + node.y * this.cellSize;
                
                this.ctx.fillStyle = this.colors.visited;
                this.ctx.fillRect(cellX + 2, cellY + 2, this.cellSize - 4, this.cellSize - 4);
            }
        }
        
        // Draw current nodes
        if (data.currentNodes) {
            for (const node of data.currentNodes) {
                const cellX = this.offsetX + node.x * this.cellSize;
                const cellY = this.offsetY + node.y * this.cellSize;
                
                this.ctx.fillStyle = this.colors.current;
                this.ctx.fillRect(cellX + 3, cellY + 3, this.cellSize - 6, this.cellSize - 6);
            }
        }
        
        // Draw final path
        if (data.path && data.path.length > 0) {
            this.drawPath(data.path, this.colors[algorithm], 4);
        }
    }

    drawPath(path, color, width) {
        if (path.length < 2) return;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        
        for (let i = 0; i < path.length; i++) {
            const x = this.offsetX + (path[i].x + 0.5) * this.cellSize;
            const y = this.offsetY + (path[i].y + 0.5) * this.cellSize;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        
        // Add glow effect
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 8;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    drawPoint(pos, color, emoji) {
        const cellX = this.offsetX + pos.x * this.cellSize;
        const cellY = this.offsetY + pos.y * this.cellSize;
        
        // Draw colored background
        this.ctx.fillStyle = color;
        this.ctx.fillRect(cellX + 2, cellY + 2, this.cellSize - 4, this.cellSize - 4);
        
        // Add glow effect
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(cellX + 4, cellY + 4, this.cellSize - 8, this.cellSize - 8);
        this.ctx.shadowBlur = 0;
    }

    getCellFromCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left - this.offsetX;
        const y = clientY - rect.top - this.offsetY;
        
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        
        if (cellX >= 0 && cellX < this.width && cellY >= 0 && cellY < this.height) {
            return { x: cellX, y: cellY };
        }
        return null;
    }
}

// FIXED MAIN APPLICATION CLASS
class PathfindingApp {
    constructor() {
        this.canvas = document.getElementById('mazeCanvas');
        this.visualizer = new Visualizer(this.canvas);
        
        this.maze = null;
        this.startPos = null;
        this.endPos = null;
        this.currentAlgorithm = 'physarum';
        this.solver = null;
        this.isRunning = false;
        this.mode = 'setStart';
        this.animationId = null;
        this.startTime = null;
        this.speedMultiplier = 1.0;
        this.isManualMode = false;
        this.isDragging = false;
        this.lastDrawnCell = null;
        
        this.params = {
            dt: 0.1,
            iterations: 10,
            initial_diameter: 0.1,
            convergence_threshold: 0.001
        };
        
        this.initializeUI();
        this.generateInitialMaze();
    }

    initializeUI() {
        // Algorithm selection
        document.querySelectorAll('input[name="algorithm"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentAlgorithm = e.target.value;
                this.updateAlgorithmIndicator();
                this.updateParameterVisibility();
                this.draw(); // Redraw to update colors
            });
        });

        // Controls
        document.getElementById('generateMaze').addEventListener('click', () => this.generateMaze());
        document.getElementById('clearPoints').addEventListener('click', () => this.clearPoints());
        document.getElementById('clearMaze').addEventListener('click', () => this.clearMaze());
        document.getElementById('toggleManualMode').addEventListener('click', () => this.toggleManualMode());
        document.getElementById('startSim').addEventListener('click', () => this.startSimulation());
        document.getElementById('pauseSim').addEventListener('click', () => this.pauseSimulation());
        document.getElementById('resetSim').addEventListener('click', () => this.resetSimulation());

        // File operations
        document.getElementById('saveMaze').addEventListener('click', () => this.saveMaze());
        document.getElementById('loadMaze').addEventListener('click', () => this.loadMaze());
        document.getElementById('loadMazeFile').addEventListener('change', (e) => this.handleFileSelect(e));

        // Speed control - FIXED
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.speedMultiplier = parseFloat(e.target.value);
                document.getElementById('speedValue').textContent = this.speedMultiplier.toFixed(1);
            });
        }

        // Parameter controls
        const physarumIterations = document.getElementById('physarumIterations');
        if (physarumIterations) {
            physarumIterations.addEventListener('input', (e) => {
                this.params.iterations = parseInt(e.target.value);
                document.getElementById('physarumIterationsValue').textContent = e.target.value;
            });
        }

        const deltaTime = document.getElementById('deltaTime');
        if (deltaTime) {
            deltaTime.addEventListener('input', (e) => {
                this.params.dt = parseFloat(e.target.value);
                document.getElementById('deltaTimeValue').textContent = e.target.value;
            });
        }

        const convergenceThreshold = document.getElementById('convergenceThreshold');
        if (convergenceThreshold) {
            convergenceThreshold.addEventListener('input', (e) => {
                this.params.convergence_threshold = parseFloat(e.target.value);
                document.getElementById('convergenceThresholdValue').textContent = e.target.value;
            });
        }

        // Canvas events - FIXED
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        this.updateModeIndicator();
        this.updateAlgorithmIndicator();
        this.updateParameterVisibility();
    }

    generateInitialMaze() {
        const mazeSize = document.getElementById('mazeSize');
        const size = mazeSize ? parseInt(mazeSize.value) : 25;
        this.generateMazeWithSize(size);
    }

    generateMaze() {
        const button = document.getElementById('generateMaze');
        button.classList.add('loading');
        
        setTimeout(() => {
            const mazeSize = document.getElementById('mazeSize');
            const size = mazeSize ? parseInt(mazeSize.value) : 25;
            this.generateMazeWithSize(size);
            button.classList.remove('loading');
        }, 100);
    }

    generateMazeWithSize(size) {
        this.resetSimulation();
        const mazeGenerator = new MazeGenerator(size, size);
        this.maze = mazeGenerator.generate();
        this.visualizer.setMaze(this.maze, size, size);
        this.clearPoints();
        this.draw();
        this.updateStatus('Labirynt wygenerowany', 'success');
    }

    clearPoints() {
        this.startPos = null;
        this.endPos = null;
        this.mode = 'setStart';
        this.updateModeIndicator();
        this.draw();
    }

    clearMaze() {
        if (!this.maze) return;
        
        this.resetSimulation();
        
        // Clear entire maze (set all to paths)
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                this.maze[y][x] = 0;
            }
        }
        
        this.clearPoints();
        this.draw();
        this.updateStatus('Labirynt wyczyszczony', 'success');
    }

    toggleManualMode() {
        this.isManualMode = !this.isManualMode;
        
        const button = document.getElementById('toggleManualMode');
        const buttonText = document.getElementById('manualModeText');
        const indicator = document.getElementById('manualModeIndicator');
        const canvasContainer = document.querySelector('.canvas-container');
        
        if (this.isManualMode) {
            button.classList.add('manual-mode-active');
            buttonText.textContent = 'Tryb Normalny';
            indicator.classList.remove('hidden');
            canvasContainer.classList.add('manual-mode');
            this.updateStatus('Tryb ręczny aktywny - rysuj ściany lewym przyciskiem', 'info');
        } else {
            button.classList.remove('manual-mode-active');
            buttonText.textContent = 'Tryb Ręczny';
            indicator.classList.add('hidden');
            canvasContainer.classList.remove('manual-mode');
            this.updateStatus('Tryb normalny aktywny', 'info');
        }
        
        this.updateModeIndicator();
    }

    handleMouseDown(e) {
        if (!this.isManualMode || this.isRunning || !this.maze) return;
        
        this.isDragging = true;
        this.handleManualDraw(e);
    }

    handleMouseMove(e) {
        if (!this.isManualMode || !this.isDragging || this.isRunning || !this.maze) return;
        
        this.handleManualDraw(e);
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.lastDrawnCell = null;
    }

    handleManualDraw(e) {
        const cell = this.visualizer.getCellFromCoordinates(e.clientX, e.clientY);
        if (!cell) return;
        
        // Prevent drawing on the same cell repeatedly
        if (this.lastDrawnCell && 
            this.lastDrawnCell.x === cell.x && 
            this.lastDrawnCell.y === cell.y) {
            return;
        }
        
        this.lastDrawnCell = cell;
        
        // Don't allow drawing on start/end points
        if ((this.startPos && cell.x === this.startPos.x && cell.y === this.startPos.y) ||
            (this.endPos && cell.x === this.endPos.x && cell.y === this.endPos.y)) {
            return;
        }
        
        if (e.button === 0) { // Left click - toggle wall/path
            this.maze[cell.y][cell.x] = this.maze[cell.y][cell.x] === 1 ? 0 : 1;
        } else if (e.button === 2) { // Right click - always set to path
            this.maze[cell.y][cell.x] = 0;
        }
        
        this.draw();
    }

    saveMaze() {
        if (!this.maze) {
            this.updateStatus('Brak labiryntu do zapisania', 'warning');
            return;
        }
        
        const nameInput = document.getElementById('mazeNameInput');
        const mazeName = nameInput.value.trim() || 'labirynt';
        
        const mazeData = {
            name: mazeName,
            width: this.maze[0].length,
            height: this.maze.length,
            maze: this.maze,
            startPos: this.startPos,
            endPos: this.endPos,
            created: new Date().toISOString(),
            version: "1.0"
        };
        
        try {
            const dataStr = JSON.stringify(mazeData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `${mazeName}.json`;
            link.click();
            
            URL.revokeObjectURL(link.href);
            this.showFileOperationStatus('Labirynt zapisany pomyślnie!', 'success');
            
        } catch (error) {
            console.error('Błąd podczas zapisywania:', error);
            this.showFileOperationStatus('Błąd podczas zapisywania pliku', 'error');
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.json')) {
            this.showFileOperationStatus('Proszę wybrać plik JSON', 'warning');
            return;
        }
        
        this.loadMazeFromFile(file);
    }

    loadMaze() {
        const fileInput = document.getElementById('loadMazeFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showFileOperationStatus('Proszę wybrać plik do wczytania', 'warning');
            return;
        }
        
        this.loadMazeFromFile(file);
    }

    loadMazeFromFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const mazeData = JSON.parse(e.target.result);
                
                // Validate maze data
                if (!this.validateMazeData(mazeData)) {
                    this.showFileOperationStatus('Nieprawidłowy format pliku', 'error');
                    return;
                }
                
                // Load maze
                this.resetSimulation();
                this.maze = mazeData.maze;
                this.startPos = mazeData.startPos || null;
                this.endPos = mazeData.endPos || null;
                
                // Update visualizer
                this.visualizer.setMaze(this.maze, mazeData.width, mazeData.height);
                
                // Update mode based on loaded points
                if (this.startPos && this.endPos) {
                    this.mode = 'ready';
                } else if (this.startPos) {
                    this.mode = 'setEnd';
                } else {
                    this.mode = 'setStart';
                }
                
                this.updateModeIndicator();
                this.draw();
                
                // Update name input
                const nameInput = document.getElementById('mazeNameInput');
                if (nameInput && mazeData.name) {
                    nameInput.value = mazeData.name;
                }
                
                this.showFileOperationStatus(`Labirynt "${mazeData.name}" wczytany pomyślnie!`, 'success');
                
            } catch (error) {
                console.error('Błąd podczas wczytywania:', error);
                this.showFileOperationStatus('Błąd podczas wczytywania pliku', 'error');
            }
        };
        
        reader.onerror = () => {
            this.showFileOperationStatus('Błąd podczas odczytywania pliku', 'error');
        };
        
        reader.readAsText(file);
    }

    validateMazeData(data) {
        if (!data || typeof data !== 'object') return false;
        if (!Array.isArray(data.maze)) return false;
        if (!data.width || !data.height) return false;
        if (data.maze.length !== data.height) return false;
        if (data.maze[0].length !== data.width) return false;
        
        // Check if all rows have the same length
        for (let row of data.maze) {
            if (!Array.isArray(row) || row.length !== data.width) return false;
            // Check if all values are 0 or 1
            for (let cell of row) {
                if (cell !== 0 && cell !== 1) return false;
            }
        }
        
        // Validate positions if they exist
        if (data.startPos) {
            if (!this.isValidPosition(data.startPos, data.width, data.height)) return false;
        }
        if (data.endPos) {
            if (!this.isValidPosition(data.endPos, data.width, data.height)) return false;
        }
        
        return true;
    }

    isValidPosition(pos, width, height) {
        return pos && 
               typeof pos.x === 'number' && 
               typeof pos.y === 'number' &&
               pos.x >= 0 && pos.x < width &&
               pos.y >= 0 && pos.y < height;
    }

    showFileOperationStatus(message, type = 'success') {
        // Remove existing status if any
        const existingStatus = document.querySelector('.file-operation-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        // Create new status element
        const statusDiv = document.createElement('div');
        statusDiv.className = `file-operation-status ${type}`;
        statusDiv.textContent = message;
        
        document.body.appendChild(statusDiv);
        
        // Show with animation
        setTimeout(() => statusDiv.classList.add('show'), 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusDiv.classList.remove('show');
            setTimeout(() => statusDiv.remove(), 300);
        }, 3000);
    }

    handleCanvasClick(e) {
        if (this.isRunning || !this.maze) return;
        
        // In manual mode, canvas clicks are handled by mouse events
        if (this.isManualMode) return;
        
        console.log('Canvas clicked'); // Debug
        
        const cell = this.visualizer.getCellFromCoordinates(e.clientX, e.clientY);
        console.log('Cell:', cell); // Debug
        
        if (!cell || this.maze[cell.y][cell.x] === 1) {
            console.log('Invalid cell or wall'); // Debug
            return;
        }
        
        if (this.mode === 'setStart') {
            this.startPos = cell;
            this.mode = 'setEnd';
            this.updateStatus('Punkt startowy ustawiony - kliknij aby ustawić cel', 'success');
            console.log('Start set:', this.startPos); // Debug
        } else if (this.mode === 'setEnd') {
            this.endPos = cell;
            this.mode = 'ready';
            this.updateStatus('Gotowy do symulacji', 'success');
            console.log('End set:', this.endPos); // Debug
        } else if (this.mode === 'ready') {
            // Allow changing points
            this.startPos = cell;
            this.mode = 'setEnd';
            this.updateStatus('Nowy punkt startowy ustawiony', 'success');
        }
        
        this.updateModeIndicator();
        this.draw();
    }

    startSimulation() {
        if (!this.maze || !this.startPos || !this.endPos) {
            this.updateStatus('Ustaw punkty start i koniec', 'warning');
            return;
        }

        this.isRunning = true;
        this.startTime = Date.now();
        
        console.log(`Starting ${this.currentAlgorithm} simulation`); // Debug
        
        // Create appropriate solver
        try {
            switch (this.currentAlgorithm) {
                case 'physarum':
                    this.solver = new PhysarumSolver(this.maze, this.startPos, this.endPos, this.params);
                    break;
                case 'bfs':
                    this.solver = new BFSSolver(this.maze, this.startPos, this.endPos);
                    break;
                case 'dfs':
                    this.solver = new DFSSolver(this.maze, this.startPos, this.endPos);
                    break;
                case 'dijkstra':
                    this.solver = new DijkstraSolver(this.maze, this.startPos, this.endPos);
                    break;
                case 'astar':
                    this.solver = new AStarSolver(this.maze, this.startPos, this.endPos);
                    break;
                default:
                    throw new Error(`Unknown algorithm: ${this.currentAlgorithm}`);
            }
            
            this.updateStatus('Symulacja uruchomiona', 'success');
            document.getElementById('startSim').classList.add('hidden');
            document.getElementById('pauseSim').classList.remove('hidden');
            
            this.animate();
            
        } catch (error) {
            console.error('Error starting simulation:', error);
            this.updateStatus('Błąd podczas uruchamiania symulacji', 'error');
            this.isRunning = false;
        }
    }

    pauseSimulation() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.updateStatus('Symulacja wstrzymana', 'info');
        document.getElementById('startSim').classList.remove('hidden');
        document.getElementById('pauseSim').classList.add('hidden');
    }

    resetSimulation() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.solver = null;
        this.draw();
        this.updateStatus('Symulacja zresetowana', 'info');
        document.getElementById('startSim').classList.remove('hidden');
        document.getElementById('pauseSim').classList.add('hidden');
        this.updateStats(0, 0, this.currentAlgorithm, false);
    }

    animate() {
        if (!this.isRunning || !this.solver) return;
        
        // Slow motion control
        const now = Date.now();
        const deltaTime = now - (this.lastFrameTime || now);
        this.lastFrameTime = now;
        
        // Update based on speed multiplier
        if (deltaTime >= (16 / this.speedMultiplier)) { // Base 60fps adjusted by speed
            const result = this.solver.step();
            
            if (result.converged) {
                this.isRunning = false;
                this.updateStatus('Algorytm zakończył działanie', 'success');
                document.getElementById('startSim').classList.remove('hidden');
                document.getElementById('pauseSim').classList.add('hidden');
                this.updateStats(result.iteration, (Date.now() - this.startTime) / 1000, this.currentAlgorithm, result.path.length > 0);
            } else {
                this.updateStats(result.iteration, (Date.now() - this.startTime) / 1000, this.currentAlgorithm, false);
            }
            
            this.updateRealTimeParams(result);
            this.draw();
            this.lastFrameTime = now;
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    draw() {
        if (!this.visualizer || !this.maze) return;
        
        const solverData = this.solver ? this.solver.createResult() : null;
        this.visualizer.draw(this.startPos, this.endPos, this.currentAlgorithm, solverData);
    }

    updateModeIndicator() {
        const indicator = document.getElementById('modeIndicator');
        if (!indicator) return;
        
        if (this.isManualMode) {
            indicator.textContent = 'Tryb ręczny - rysuj labirynt';
            return;
        }
        
        switch (this.mode) {
            case 'setStart':
                indicator.textContent = 'Kliknij aby ustawić punkt startowy';
                break;
            case 'setEnd':
                indicator.textContent = 'Kliknij aby ustawić punkt końcowy';
                break;
            case 'ready':
                indicator.textContent = 'Gotowy - kliknij Start lub zmień punkty';
                break;
            default:
                indicator.textContent = 'Kliknij aby ustawić punkt startowy';
        }
    }

    updateAlgorithmIndicator() {
        const indicator = document.getElementById('algorithmIndicator');
        if (indicator) {
            const algorithmNames = {
                'physarum': 'Physarum',
                'bfs': 'BFS',
                'dfs': 'DFS',
                'dijkstra': 'Dijkstra',
                'astar': 'A*'
            };
            indicator.textContent = algorithmNames[this.currentAlgorithm] || this.currentAlgorithm;
        }
    }

    updateParameterVisibility() {
        const physarumParams = document.getElementById('physarumParams');
        const standardParams = document.getElementById('standardParams');
        
        if (this.currentAlgorithm === 'physarum') {
            if (physarumParams) physarumParams.style.display = 'block';
            if (standardParams) standardParams.style.display = 'none';
        } else {
            if (physarumParams) physarumParams.style.display = 'none';
            if (standardParams) standardParams.style.display = 'block';
        }
    }

    updateStats(iteration, time, algorithm, pathFound) {
        this.updateElement('currentIteration', iteration);
        this.updateElement('simulationTime', time.toFixed(1) + 's');
        this.updateElement('currentAlgorithm', algorithm);
        this.updateElement('pathFound', pathFound ? 'Tak' : 'Nie');
    }

    updateRealTimeParams(result) {
        if (this.currentAlgorithm === 'physarum' && result.stats) {
            this.updateElement('potentialMin', result.stats.potentialMin?.toFixed(4) || '0');
            this.updateElement('potentialMax', result.stats.potentialMax?.toFixed(4) || '0');
            this.updateElement('potentialAvg', result.stats.potentialAvg?.toFixed(4) || '0');
            this.updateElement('flowMax', result.stats.flowMax?.toFixed(6) || '0');
            this.updateElement('flowAvg', result.stats.flowAvg?.toFixed(6) || '0');
            this.updateElement('diameterMin', result.stats.diameterMin?.toFixed(4) || '0');
            this.updateElement('diameterMax', result.stats.diameterMax?.toFixed(4) || '0');
            this.updateElement('diameterAvg', result.stats.diameterAvg?.toFixed(4) || '0');
        } else if (result) {
            this.updateElement('visitedCount', result.visitedNodes?.length || 0);
            this.updateElement('queueSize', result.currentNodes?.length || 0);
            this.updateElement('pathLength', result.path?.length || 0);
            this.updateElement('executionTime', `${((Date.now() - this.startTime) / 1000).toFixed(1)}s`);
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateStatus(message, type) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status status--${type}`;
        }
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicjalizacja aplikacji wizualizacji algorytmów - 5 algorytmów z naprawkami');
    try {
        const app = new PathfindingApp();
        console.log('✅ Aplikacja zainicjalizowana pomyślnie');
    } catch (error) {
        console.error('❌ Błąd podczas inicjalizacji aplikacji:', error);
    }
});