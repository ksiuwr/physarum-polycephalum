// Breadth-First Search algorithm for pathfinding
// Explores all nodes at the current depth level before moving to the next depth level
export class BFSSolver {
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
