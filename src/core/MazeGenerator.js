// Maze generator using recursive backtracking algorithm
// Creates random mazes with guaranteed solution paths
export class MazeGenerator {
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
