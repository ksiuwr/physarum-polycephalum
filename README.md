# Physarum Polycephalum Pathfinding Visualization

Wizualizacja algorytmów znajdowania ścieżek inspirowana zachowaniem śluzowca Physarum polycephalum oraz klasycznymi algorytmami przeszukiwania grafów.

## Algorytmy

Aplikacja zawiera 5 algorytmów znajdowania ścieżek:

1. **Physarum** - Algorytm inspirowany zachowaniem śluzowca
2. **BFS** (Breadth-First Search) - Przeszukiwanie wszerz
3. **DFS** (Depth-First Search) - Przeszukiwanie w głąb
4. **Dijkstra** - Algorytm Dijkstry
5. **A*** - Algorytm A-gwiazdka

## Jak uruchomić

### Wymagania
- Przeglądarka internetowa obsługująca ES6 modules
- Serwer HTTP (ze względu na CORS policy dla modułów ES6)

### Uruchomienie lokalnie

1. **Opcja 1: Python HTTP Server**
   ```bash
   # W katalogu projektu uruchom:
   python3 -m http.server 8080
   
   # Następnie otwórz w przeglądarce:
   # http://localhost:8080
   ```

2. **Opcja 2: Node.js HTTP Server**
   ```bash
   # Zainstaluj serwer globalnie (jeśli nie masz):
   npm install -g http-server
   
   # W katalogu projektu uruchom:
   http-server -p 8080
   
   # Następnie otwórz w przeglądarce:
   # http://localhost:8080
   ```

3. **Opcja 3: Live Server (VS Code)**
   - Zainstaluj rozszerzenie "Live Server" w VS Code
   - Kliknij prawym przyciskiem na `index.html`
   - Wybierz "Open with Live Server"

### Alternatywne porty

Jeśli port 8080 jest zajęty, możesz użyć innego portu:

```bash
# Python
python3 -m http.server 3000

# Node.js
http-server -p 3000
```

Następnie otwórz odpowiedni adres w przeglądarce (np. `http://localhost:3000`).

## Użytkowanie

1. **Generowanie labiryntu**: Kliknij "Generuj Labirynt"
2. **Ustawianie punktów**: Kliknij na labiryncie aby ustawić punkt startowy i końcowy
3. **Wybór algorytmu**: Wybierz algorytm z menu radiowego
4. **Uruchomienie**: Kliknij "Start" aby rozpocząć wizualizację
5. **Parametry**: Dostosuj parametry algorytmów w panelu bocznym

## Funkcje

- ✅ Wizualizacja 5 różnych algorytmów
- ✅ Interaktywne ustawianie punktów start/koniec
- ✅ Tryb ręcznego rysowania labiryntu
- ✅ Zapis i wczytywanie labiryntów
- ✅ Regulacja prędkości animacji
- ✅ Statystyki w czasie rzeczywistym
- ✅ Responsywny design

## Struktura projektu

```
├── index.html          # Główny plik HTML
├── style.css           # Style CSS
├── src/
│   ├── main.js          # Punkt wejścia aplikacji
│   ├── core/
│   │   ├── PathfindingApp.js    # Główna klasa aplikacji
│   │   ├── Visualizer.js        # Renderer canvas
│   │   └── MazeGenerator.js     # Generator labiryntów
│   └── algorithms/
│       ├── PhysarumSolver.js    # Algorytm Physarum
│       ├── BFSSolver.js         # Algorytm BFS
│       ├── DFSSolver.js         # Algorytm DFS
│       ├── DijkstraSolver.js    # Algorytm Dijkstra
│       └── AStarSolver.js       # Algorytm A*
└── papers/              # Dokumentacja naukowa
```

## Inspiracja

Projekt inspirowany jest zachowaniem śluzowca Physarum polycephalum, który potrafi znajdować optymalne ścieżki między źródłami pożywienia poprzez dynamiczne formowanie sieci naczyń transportowych.
