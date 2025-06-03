/**
 * Main entry point for the Physarum Polycephalum Pathfinding Visualization
 * 
 * This is the main module that initializes the application and coordinates
 * all the imported components including algorithms, core functionality,
 * and visualization components.
 */

import { PathfindingApp } from './core/PathfindingApp.js';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicjalizacja aplikacji wizualizacji algorytmów - Modułowa wersja z 5 algorytmami');
    try {
        const app = new PathfindingApp();
        console.log('✅ Aplikacja zainicjalizowana pomyślnie');
        
        // Make app globally available for debugging if needed
        window.pathfindingApp = app;
        
    } catch (error) {
        console.error('❌ Błąd podczas inicjalizacji aplikacji:', error);
        
        // Show user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #e74c3c;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            z-index: 1000;
            font-family: Arial, sans-serif;
        `;
        errorDiv.textContent = 'Błąd podczas ładowania aplikacji. Sprawdź konsolę przeglądarki.';
        document.body.appendChild(errorDiv);
    }
});
