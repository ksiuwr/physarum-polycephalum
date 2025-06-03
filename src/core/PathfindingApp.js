/**
 * PathfindingApp class - Main application controller that orchestrates
 * the entire pathfinding visualization application.
 * 
 * Features:
 * - Application state management and coordination
 * - UI event handling and user interactions
 * - Algorithm execution and animation control
 * - File operations (save/load maze configurations)
 * - Manual maze editing mode
 * - Real-time statistics and parameter updates
 */

import { Visualizer } from './Visualizer.js';
import { MazeGenerator } from './MazeGenerator.js';
import { PhysarumSolver } from '../algorithms/PhysarumSolver.js';
import { BFSSolver } from '../algorithms/BFSSolver.js';
import { DFSSolver } from '../algorithms/DFSSolver.js';
import { DijkstraSolver } from '../algorithms/DijkstraSolver.js';
import { AStarSolver } from '../algorithms/AStarSolver.js';

export class PathfindingApp {
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

        // Speed control
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

        // Canvas events
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
