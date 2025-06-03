// Physarum polycephalum algorithm for pathfinding
// This algorithm simulates the behavior of slime mold to find optimal paths
export class PhysarumSolver {
    constructor(maze, startPos, endPos, params) {
        console.log('PhysarumSolver constructor called with:', { maze: maze.length + 'x' + maze[0].length, startPos, endPos, params }); // Debug
        
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
        
        console.log(`Physarum step ${this.iteration}`); // Debug
        
        // Auto-converge after reasonable iterations
        if (this.iteration >= 150) {
            this.converged = true;
            console.log('Physarum converged after 150 iterations'); // Debug
            this.findMainPath();
            return this.createResult();
        }
        
        this.setBoundaryConditions();
        this.solvePotentials();
        this.calculateFlows();
        this.updateDiameters();
        this.checkConvergence();
        
        const result = this.createResult();
        console.log(`Step ${this.iteration}, path length: ${this.path.length}, converged: ${this.converged}`); // Debug
        
        return result;
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
        // More sophisticated convergence detection
        // Physarum converges when the tube network stabilizes
        
        if (this.iteration > 30) { // Give it time to explore first
            // Check if flows have stabilized (low change rate)
            const flowStability = this.maxFlow < 0.005;
            
            // Check if there's a clear dominant path forming
            const allDiameters = [...this.diameters.horizontal.flat(), ...this.diameters.vertical.flat()];
            const maxDiameter = Math.max(...allDiameters);
            const avgDiameter = allDiameters.reduce((a, b) => a + b, 0) / allDiameters.length;
            const hasStrongPath = maxDiameter > avgDiameter * 3; // Strong path is 3x thicker than average
            
            if (flowStability && hasStrongPath) {
                this.stabilityCounter++;
                if (this.stabilityCounter >= 5) { // Reduced from 10 for faster response
                    this.converged = true;
                    this.findMainPath();
                    console.log(`Physarum converged after ${this.iteration} iterations with max diameter ${maxDiameter.toFixed(4)}`);
                }
            } else {
                this.stabilityCounter = Math.max(0, this.stabilityCounter - 1); // Gradual decay
            }
        }
        
        // Also check for diameter-based convergence
        if (this.iteration > 80) {
            const allDiameters = [...this.diameters.horizontal.flat(), ...this.diameters.vertical.flat()];
            const significantTubes = allDiameters.filter(d => d > 0.1).length;
            const totalTubes = allDiameters.length;
            
            // If most tubes have withered away, the network has converged
            if (significantTubes < totalTubes * 0.3) {
                this.converged = true;
                this.findMainPath();
                console.log(`Physarum converged by tube pruning: ${significantTubes}/${totalTubes} tubes remain`);
            }
        }
    }

    findMainPath() {
        console.log('Starting findMainPath()'); // Debug
        
        // Find the path following the thickest slime mold tubes (highest diameters)
        // This is the TRUE Physarum path, not a cheating BFS!
        
        const path = [this.startPos];
        let current = { ...this.startPos };
        const visited = Array(this.height).fill().map(() => Array(this.width).fill(false));
        visited[current.y][current.x] = true;
        
        console.log(`Starting from ${current.x}, ${current.y} to ${this.endPos.x}, ${this.endPos.y}`); // Debug
        
        // Follow the thickest tubes from start to end
        while (current.x !== this.endPos.x || current.y !== this.endPos.y) {
            let bestNext = null;
            let maxDiameter = 0;
            
            // Check all 4 directions and find the thickest tube
            const directions = [
                { dx: 1, dy: 0, isHorizontal: true, edgeX: current.x, edgeY: current.y },      // Right
                { dx: -1, dy: 0, isHorizontal: true, edgeX: current.x - 1, edgeY: current.y }, // Left  
                { dx: 0, dy: 1, isHorizontal: false, edgeX: current.x, edgeY: current.y },     // Down
                { dx: 0, dy: -1, isHorizontal: false, edgeX: current.x, edgeY: current.y - 1 } // Up
            ];
            
            for (const dir of directions) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                
                // Check if the next cell is valid and not visited
                if (!this.isValidCell(nx, ny) || this.maze[ny][nx] === 1 || visited[ny][nx]) {
                    continue;
                }
                
                // Check if the edge exists and get its diameter
                if (dir.isHorizontal && dir.edgeX >= 0 && dir.edgeX < this.width - 1 && 
                    dir.edgeY >= 0 && dir.edgeY < this.height) {
                    const diameter = this.diameters.horizontal[dir.edgeY][dir.edgeX];
                    if (diameter > maxDiameter) {
                        maxDiameter = diameter;
                        bestNext = { x: nx, y: ny };
                    }
                } else if (!dir.isHorizontal && dir.edgeX >= 0 && dir.edgeX < this.width && 
                           dir.edgeY >= 0 && dir.edgeY < this.height - 1) {
                    const diameter = this.diameters.vertical[dir.edgeY][dir.edgeX];
                    if (diameter > maxDiameter) {
                        maxDiameter = diameter;
                        bestNext = { x: nx, y: ny };
                    }
                }
            }
            
            // If we found a good next step, take it
            if (bestNext && maxDiameter > 0.01) { // Only follow meaningful tubes
                current = bestNext;
                visited[current.y][current.x] = true;
                path.push({ ...current });
            } else {
                // If stuck, try to find any unvisited neighbor (fallback)
                let foundAlternative = false;
                for (const dir of directions) {
                    const nx = current.x + dir.dx;
                    const ny = current.y + dir.dy;
                    
                    if (this.isValidCell(nx, ny) && this.maze[ny][nx] === 0 && !visited[ny][nx]) {
                        current = { x: nx, y: ny };
                        visited[current.y][current.x] = true;
                        path.push({ ...current });
                        foundAlternative = true;
                        break;
                    }
                }
                
                // If completely stuck, break to avoid infinite loop
                if (!foundAlternative) {
                    console.warn('Physarum path finding got stuck - slime mold could not reach the target');
                    break;
                }
            }
            
            // Safety check to prevent infinite loops
            if (path.length > this.width * this.height) {
                console.warn('Physarum path too long - stopping to prevent infinite loop');
                break;
            }
        }
        
        this.path = path;
        console.log(`Physarum found path of length ${path.length} following tube network`);
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
        const significantTubes = allDiameters.filter(d => d > 0.1);
        
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
                diameterAvg: allDiameters.reduce((a, b) => a + b, 0) / allDiameters.length,
                // New Physarum-specific stats
                significantTubes: significantTubes.length,
                totalTubes: allDiameters.length,
                networkDensity: (significantTubes.length / allDiameters.length * 100).toFixed(1),
                stabilityCounter: this.stabilityCounter,
                convergenceReason: this.converged ? this.getConvergenceReason() : 'W trakcie'
            }
        };
    }

    getConvergenceReason() {
        if (this.iteration >= 150) {
            return 'Limit iteracji';
        }
        const allDiameters = [...this.diameters.horizontal.flat(), ...this.diameters.vertical.flat()];
        const significantTubes = allDiameters.filter(d => d > 0.1).length;
        const totalTubes = allDiameters.length;
        
        if (significantTubes < totalTubes * 0.3) {
            return 'Redukcja sieci';
        }
        return 'Stabilizacja przepływu';
    }
}
