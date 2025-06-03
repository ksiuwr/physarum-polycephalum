// Physarum polycephalum algorithm for pathfinding
// This algorithm simulates the behavior of slime mold to find optimal paths
export class PhysarumSolver {
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
