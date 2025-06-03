// Dijkstra's algorithm for pathfinding
// Finds the shortest path between nodes by exploring paths with lowest cost first
export class DijkstraSolver {
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
