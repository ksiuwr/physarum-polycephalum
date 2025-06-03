// A* (A-star) algorithm for pathfinding
// Uses both distance from start and heuristic distance to goal for optimal pathfinding
export class AStarSolver {
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
