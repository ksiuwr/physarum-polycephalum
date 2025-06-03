/**
 * Visualizer class - Handles all canvas rendering and visual representation
 * of the pathfinding algorithms, maze, and interactive elements.
 * 
 * Features:
 * - Dynamic canvas rendering with automatic scaling and centering
 * - Specialized rendering for each algorithm type (Physarum vs standard algorithms)
 * - Interactive visual feedback for different modes (exploration, path finding, etc.)
 * - Sophisticated Physarum visualization with flow networks and potential fields
 * - Progressive animation effects and visual enhancements
 */
export class Visualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.maze = null;
        this.width = 0;
        this.height = 0;
        this.cellSize = 20;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.colors = {
            wall: '#2c3e50',
            path: '#ecf0f1',
            start: '#27ae60',
            end: '#e74c3c',
            visited: '#3498db',
            current: '#f39c12',
            physarum: '#f1c40f',
            bfs: '#3498db',
            dfs: '#9b59b6',
            dijkstra: '#e67e22',
            astar: '#1abc9c'
        };
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        this.canvas.width = containerRect.width;
        this.canvas.height = containerRect.height;
        
        this.calculateLayout();
    }

    setMaze(maze, width, height) {
        this.maze = maze;
        this.width = width;
        this.height = height;
        this.calculateLayout();
    }

    calculateLayout() {
        if (!this.maze) return;
        
        const maxCellSize = 30;
        const minCellSize = 8;
        const padding = 20;
        
        const availableWidth = this.canvas.width - 2 * padding;
        const availableHeight = this.canvas.height - 2 * padding;
        
        const cellSizeByWidth = availableWidth / this.width;
        const cellSizeByHeight = availableHeight / this.height;
        
        this.cellSize = Math.max(minCellSize, Math.min(maxCellSize, Math.min(cellSizeByWidth, cellSizeByHeight)));
        
        const width = this.width * this.cellSize;
        const height = this.height * this.cellSize;
        
        this.offsetX = (this.canvas.width - width) / 2;
        this.offsetY = (this.canvas.height - height) / 2;
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

    drawPotentialField(potentials) {
        // Draw potential field as background visualization
        const maxPotential = Math.max(...potentials.flat());
        if (maxPotential === 0) return;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.maze[y][x] === 0) {
                    const potential = potentials[y][x];
                    const normalizedPotential = potential / maxPotential;
                    
                    if (normalizedPotential > 0.1) {
                        const cellX = this.offsetX + x * this.cellSize;
                        const cellY = this.offsetY + y * this.cellSize;
                        
                        // Use a gradient from blue (low potential) to red (high potential)
                        const alpha = normalizedPotential * 0.3;
                        const red = Math.floor(255 * normalizedPotential);
                        const blue = Math.floor(255 * (1 - normalizedPotential));
                        
                        this.ctx.fillStyle = `rgba(${red}, 100, ${blue}, ${alpha})`;
                        this.ctx.fillRect(cellX + 2, cellY + 2, this.cellSize - 4, this.cellSize - 4);
                    }
                }
            }
        }
    }

    drawPhysarumExploration(data) {
        // Draw exploration dots during early algorithm stages
        const iteration = data.iteration;
        const numDots = Math.min(50, iteration * 2);
        
        // Random exploration visualization
        for (let i = 0; i < numDots; i++) {
            // Use pseudo-random based on iteration for consistent animation
            const seed = (iteration * 100 + i) * 9301 + 49297;
            const rand1 = (seed % 233280) / 233280;
            const rand2 = ((seed * 7) % 233280) / 233280;
            
            const x = Math.floor(rand1 * this.width);
            const y = Math.floor(rand2 * this.height);
            
            if (this.maze[y] && this.maze[y][x] === 0) {
                const cellX = this.offsetX + (x + 0.5) * this.cellSize;
                const cellY = this.offsetY + (y + 0.5) * this.cellSize;
                
                // Pulsing dots
                const pulsePhase = (iteration + i * 0.1) % 30;
                const pulseIntensity = 0.5 + 0.5 * Math.sin(pulsePhase * 0.2);
                const alpha = 0.4 * pulseIntensity;
                
                this.ctx.fillStyle = `rgba(241, 196, 15, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(cellX, cellY, 2 + pulseIntensity, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }

    drawPhysarum(data) {
        // Draw potential field as background visualization
        if (data.potentials) {
            this.drawPotentialField(data.potentials);
        }
        
        // Draw flow network with progressive visualization
        if (data.flows && data.diameters) {
            this.drawFlows(data.flows, data.diameters, data.iteration);
        }
        
        // Draw exploration dots for early stages
        if (data.iteration < 30) {
            this.drawPhysarumExploration(data);
        }
        
        if (data.path && data.path.length > 0) {
            this.drawPath(data.path, this.colors.physarum, 5);
        }
    }

    drawFlows(flows, diameters, iteration = 0) {
        const maxDiameter = Math.max(
            Math.max(...diameters.horizontal.flat()),
            Math.max(...diameters.vertical.flat())
        );
        
        if (maxDiameter <= 0) return;
        
        this.ctx.lineCap = 'round';
        
        // Progress factor for gradual revelation
        const progressFactor = Math.min(1, iteration / 50);
        const minVisibleDiameter = 0.01 * (1 - progressFactor * 0.8);
        
        // Horizontal flows
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width - 1; x++) {
                if (this.maze[y][x] === 0 && this.maze[y][x + 1] === 0) {
                    const diameter = diameters.horizontal[y][x];
                    
                    if (diameter > minVisibleDiameter) {
                        const normalizedDiameter = diameter / maxDiameter;
                        
                        // Dynamic line width based on iteration
                        const baseWidth = Math.max(1, normalizedDiameter * 8);
                        const widthMultiplier = 0.3 + 0.7 * progressFactor;
                        const lineWidth = baseWidth * widthMultiplier;
                        
                        // Dynamic alpha for gradual appearance
                        const baseAlpha = Math.min(0.8, normalizedDiameter);
                        const alpha = baseAlpha * (0.2 + 0.8 * progressFactor);
                        
                        const x1 = this.offsetX + (x + 0.2) * this.cellSize;
                        const x2 = this.offsetX + (x + 0.8) * this.cellSize;
                        const y1 = this.offsetY + (y + 0.5) * this.cellSize;
                        
                        this.ctx.strokeStyle = `rgba(241, 196, 15, ${alpha})`;
                        this.ctx.lineWidth = lineWidth;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x1, y1);
                        this.ctx.lineTo(x2, y1);
                        this.ctx.stroke();
                        
                        // Add pulsing effect during early iterations
                        if (iteration < 30 && Math.random() < 0.1) {
                            this.ctx.strokeStyle = `rgba(241, 196, 15, ${alpha * 1.5})`;
                            this.ctx.lineWidth = lineWidth + 2;
                            this.ctx.beginPath();
                            this.ctx.moveTo(x1, y1);
                            this.ctx.lineTo(x2, y1);
                            this.ctx.stroke();
                        }
                    }
                }
            }
        }
        
        // Vertical flows
        for (let y = 0; y < this.height - 1; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.maze[y][x] === 0 && this.maze[y + 1][x] === 0) {
                    const diameter = diameters.vertical[y][x];
                    
                    if (diameter > minVisibleDiameter) {
                        const normalizedDiameter = diameter / maxDiameter;
                        
                        // Dynamic line width based on iteration
                        const baseWidth = Math.max(1, normalizedDiameter * 8);
                        const widthMultiplier = 0.3 + 0.7 * progressFactor;
                        const lineWidth = baseWidth * widthMultiplier;
                        
                        // Dynamic alpha for gradual appearance
                        const baseAlpha = Math.min(0.8, normalizedDiameter);
                        const alpha = baseAlpha * (0.2 + 0.8 * progressFactor);
                        
                        const x1 = this.offsetX + (x + 0.5) * this.cellSize;
                        const y1 = this.offsetY + (y + 0.2) * this.cellSize;
                        const y2 = this.offsetY + (y + 0.8) * this.cellSize;
                        
                        this.ctx.strokeStyle = `rgba(241, 196, 15, ${alpha})`;
                        this.ctx.lineWidth = lineWidth;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x1, y1);
                        this.ctx.lineTo(x1, y2);
                        this.ctx.stroke();
                        
                        // Add pulsing effect during early iterations
                        if (iteration < 30 && Math.random() < 0.1) {
                            this.ctx.strokeStyle = `rgba(241, 196, 15, ${alpha * 1.5})`;
                            this.ctx.lineWidth = lineWidth + 2;
                            this.ctx.beginPath();
                            this.ctx.moveTo(x1, y1);
                            this.ctx.lineTo(x1, y2);
                            this.ctx.stroke();
                        }
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
