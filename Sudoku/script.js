class Sudoku {
    constructor(params) {
        this.INIT = 0;
        this.RUNNING = 1;
        this.END = 2;
        
        this.id = params.id || 'sudoku_container';
        this.fixCellsNr = params.fixCellsNr || 30; // For classic Sudoku
        this.highlight = params.highlight || 1;
        this.n = 3;
        this.nn = this.n * this.n; // 9
        this.cellsNr = this.nn * this.nn; // 81
        this.hintsLeft = 3;
        this.mode = params.mode || 'classic'; // 'classic', 'symbol', 'killer'
        this.symbols = ['', '🏞️', '🏖️', '🏜️', '🏝️', '⛰️', '🌋', '🗻', '🏕️', '🏔️'];
        
        if (this.fixCellsNr < 10) this.fixCellsNr = 10;
        if (this.fixCellsNr > 70) this.fixCellsNr = 70;
        
        this.cages = []; // For Killer Sudoku
        this.cageMap = new Array(this.cellsNr).fill(-1); // Maps cell index to cage ID
        
        this.init();
        
        // Initialize timer
        this.secondsElapsed = 0;
        this.timerInterval = null;
        
        // Game settings
        this.musicEnabled = true; // Will be loaded from localStorage
        this.soundEnabled = true; // Not implemented yet, but kept for future
        this.difficulty = 'medium'; // easy, medium, hard
    }
    
    init() {
        this.status = this.INIT;
        this.cellsComplete = 0;
        this.board = [];
        this.boardSolution = []; // The full solved Sudoku grid
        this.cell = null;
        this.markNotes = false;
        this.secondsElapsed = 0;
        this.hintsLeft = 3;
        this.cages = [];
        this.cageMap = new Array(this.cellsNr).fill(-1);
        
        // Set difficulty based on fixCellsNr for classic Sudoku
        // For Killer Sudoku, this will determine the number of pre-filled cells
        switch(this.difficulty) {
            case 'easy':
                this.fixCellsNr = 45; // More given numbers for classic
                this.killerGivenNumbers = 15; // More given numbers for Killer
                break;
            case 'medium':
                this.fixCellsNr = 30; // Moderate given numbers for classic
                this.killerGivenNumbers = 5; // Moderate given numbers for Killer
                break;
            case 'hard':
                this.fixCellsNr = 20; // Fewer given numbers for classic
                this.killerGivenNumbers = 0; // No given numbers for Killer
                break;
            default:
                this.fixCellsNr = 30;
                this.killerGivenNumbers = 5;
        }
        
        // Generate the board based on mode
        if (this.mode === 'killer') {
            this.generateKillerSudokuBoard();
        } else {
            this.board = this.boardGenerator(this.n, this.fixCellsNr);
        }
        
        return this;
    }
    
    setMode(mode) {
        this.mode = mode;
        this.drawBoard();
        this.updateControls();
        
        // Update UI based on mode
        if (mode === 'symbol') {
            $('.game-container').addClass('symbol-ui');
            $('#mode_indicator').text('(Symbol Mode)');
        } else if (mode === 'killer') {
            $('.game-container').removeClass('symbol-ui'); // Killer doesn't use symbols
            $('#mode_indicator').text('(Killer Mode)');
        }
        else {
            $('.game-container').removeClass('symbol-ui');
            $('#mode_indicator').text('(Classic Mode)');
        }
    }
    
    updateControls() {
        if (this.mode === 'symbol') {
            // Show symbols in number pad
            for (let i = 1; i <= 9; i++) {
                $(`.num-btn[data-value="${i}"]`).text(this.symbols[i]);
            }
            // Show symbol legend
            $('#symbol_legend').show();
        } else {
            // Show numbers in number pad
            for (let i = 1; i <= 9; i++) {
                $(`.num-btn[data-value="${i}"]`).text(i);
            }
            // Hide symbol legend
            $('#symbol_legend').hide();
        }
    }
    
    timer() {
        if (this.status === this.RUNNING) {
            this.secondsElapsed++;
            const minutes = Math.floor(this.secondsElapsed / 60);
            const seconds = this.secondsElapsed % 60;
            $('.time').text(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
    }
    
    shuffle(array) {
        let currentIndex = array.length;
        let temporaryValue, randomIndex;
        
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        
        return array;
    }

    // --- Sudoku Board Generation (Classic & Base for Killer) ---
    boardGenerator(n, fixCellsNr) {
        let matrix_fields = [];
        let index = 0;
        
        // Generate a full Sudoku solution first
        this.boardSolution = [];
        
        // Shuffle matrix indexes
        for (let i = 0; i < this.nn; i++) {
            matrix_fields[i] = i + 1;
        }
        
        // Shuffle sudoku 'colors'
        matrix_fields = this.shuffle(matrix_fields);
        for (let i = 0; i < n * n; i++) {
            for (let j = 0; j < n * n; j++) {
                const value = Math.floor((i * n + i / n + j) % (n * n) + 1);
                this.boardSolution[index] = value;
                index++;
            }
        }
        
        // Shuffle sudokus indexes of bands on horizontal and vertical
        const blank_indexes = [];
        for (let i = 0; i < this.n; i++) {
            blank_indexes[i] = i + 1;
        }
        
        // Shuffle sudokus bands horizontal
        const bands_horizontal_indexes = this.shuffle(blank_indexes);
        let board_solution_tmp = [];
        index = 0;
        for (let i = 0; i < bands_horizontal_indexes.length; i++) {
            const j_start = (bands_horizontal_indexes[i] - 1) * this.n * this.nn;
            const j_stop = bands_horizontal_indexes[i] * this.n * this.nn;
            
            for (let j = j_start; j < j_stop; j++) {
                board_solution_tmp[index] = this.boardSolution[j];
                index++;
            }
        }
        this.boardSolution = board_solution_tmp;
        
        // Shuffle sudokus bands vertical
        const bands_vertical_indexes = this.shuffle(blank_indexes);
        board_solution_tmp = [];
        index = 0;
        for (let k = 0; k < this.nn; k++) {
            for (let i = 0; i < this.n; i++) {
                const j_start = (bands_vertical_indexes[i] - 1) * this.n;
                const j_stop = bands_vertical_indexes[i] * this.n;
                
                for (let j = j_start; j < j_stop; j++) {
                    board_solution_tmp[index] = this.boardSolution[j + (k * this.nn)];
                    index++;
                }
            }
        }
        this.boardSolution = board_solution_tmp;
        
        // Board init for classic Sudoku
        const board_indexes = [];
        const board_init = [];
        
        // Shuffle board indexes and cut empty cells    
        for (let i = 0; i < this.boardSolution.length; i++) {
            board_indexes[i] = i;
            board_init[i] = 0;
        }
        
        const shuffledIndexes = this.shuffle(board_indexes);
        const selectedIndexes = shuffledIndexes.slice(0, fixCellsNr);
        
        // Build the init board    
        for (let i = 0; i < selectedIndexes.length; i++) {
            board_init[selectedIndexes[i]] = this.boardSolution[selectedIndexes[i]];
            if (parseInt(board_init[selectedIndexes[i]])) {
                this.cellsComplete++;
            }
        }
        
        return board_init;
    }

    // --- Killer Sudoku Generation (Simplified) ---
    generateKillerSudokuBoard() {
        // 1. Generate a full Sudoku solution first
        this.boardGenerator(this.n, 81); // Generate a full solution, not a puzzle
        
        // 2. Initialize the game board with all zeros
        this.board = new Array(this.cellsNr).fill(0);
        
        // 3. Generate cages
        this.cages = [];
        this.cageMap = new Array(this.cellsNr).fill(-1); // -1 means not assigned to a cage
        let cageIdCounter = 0;
        let cellsToAssign = Array.from({ length: this.cellsNr }, (_, i) => i); // All cell indices

        // Shuffle cellsToAssign to start cage generation from random points
        this.shuffle(cellsToAssign);

        while (cellsToAssign.length > 0) {
            const startCellIdx = cellsToAssign.pop(); // Get a random unassigned cell
            if (this.cageMap[startCellIdx] !== -1) {
                continue; // Already assigned to a cage
            }

            cageIdCounter++;
            let currentCageCells = [startCellIdx];
            this.cageMap[startCellIdx] = cageIdCounter;
            let currentCageSum = this.boardSolution[startCellIdx];

            // Randomly decide cage size (e.g., 2 to 5 cells)
            // Ensure minimum 2 cells for a cage, unless it's the last cell
            const minCageSize = 2;
            const maxCageSize = Math.min(5, cellsToAssign.length + 1); 
            const targetCageSize = Math.floor(Math.random() * (maxCageSize - minCageSize + 1)) + minCageSize; 

            // Try to grow the cage
            let attempts = 0;
            while (currentCageCells.length < targetCageSize && attempts < 20) { // Limit attempts to prevent infinite loops
                attempts++;
                const lastCellInCage = currentCageCells[currentCageCells.length - 1];
                const neighbors = this.getNeighbors(lastCellInCage);
                this.shuffle(neighbors); // Randomize neighbor selection

                let addedToCage = false;
                for (const neighborIdx of neighbors) {
                    if (this.cageMap[neighborIdx] === -1) { // If neighbor is unassigned
                        // Check if adding this cell would create duplicates in the cage (Killer Sudoku rule)
                        const tempCageValues = currentCageCells.map(idx => this.boardSolution[idx]).concat(this.boardSolution[neighborIdx]);
                        if (new Set(tempCageValues).size === tempCageValues.length) {
                            currentCageCells.push(neighborIdx);
                            this.cageMap[neighborIdx] = cageIdCounter;
                            currentCageSum += this.boardSolution[neighborIdx];
                            cellsToAssign = cellsToAssign.filter(idx => idx !== neighborIdx); // Remove from unassigned
                            addedToCage = true;
                            break; // Move to next cell in cage
                        }
                    }
                }
                if (!addedToCage && currentCageCells.length < targetCageSize) {
                    // If no valid neighbor found, try from another cell in the current cage
                    this.shuffle(currentCageCells); // Shuffle to pick a new base for growing
                }
            }
            
            this.cages.push({
                id: cageIdCounter,
                sum: currentCageSum,
                cells: currentCageCells
            });
        }
        
        // Ensure all cells are assigned to a cage (fallback for any unassigned cells)
        // This can happen if the growing logic gets stuck.
        for(let i = 0; i < this.cellsNr; i++) {
            if(this.cageMap[i] === -1) {
                cageIdCounter++;
                this.cages.push({
                    id: cageIdCounter,
                    sum: this.boardSolution[i],
                    cells: [i]
                });
                this.cageMap[i] = cageIdCounter;
            }
        }

        // Re-sort cages by their first cell index for consistent rendering
        this.cages.sort((a, b) => Math.min(...a.cells) - Math.min(...b.cells));

        // 4. Add pre-filled numbers based on difficulty (killerGivenNumbers)
        if (this.killerGivenNumbers > 0) {
            const allCellIndices = Array.from({ length: this.cellsNr }, (_, i) => i);
            this.shuffle(allCellIndices); // Randomize order of cells

            let cellsFilled = 0;
            for (const idx of allCellIndices) {
                if (cellsFilled >= this.killerGivenNumbers) break;

                // Only fill if it doesn't violate any Killer Sudoku rules (duplicates in cage)
                // This check is simplified; a full check would be more complex.
                const cageId = this.cageMap[idx];
                const cage = this.cages.find(c => c.id === cageId);
                if (cage) {
                    const currentCageValues = cage.cells.map(cIdx => this.board[cIdx]).filter(val => val !== 0);
                    if (!currentCageValues.includes(this.boardSolution[idx])) {
                        this.board[idx] = this.boardSolution[idx];
                        cellsFilled++;
                    }
                }
            }
        }
    }

    // Helper for Killer Sudoku: Get valid neighbors of a cell index
    getNeighbors(idx) {
        const neighbors = [];
        const row = Math.floor(idx / this.nn);
        const col = idx % this.nn;

        // Top
        if (row > 0) neighbors.push(idx - this.nn);
        // Bottom
        if (row < this.nn - 1) neighbors.push(idx + this.nn);
        // Left
        if (col > 0) neighbors.push(idx - 1);
        // Right
        if (col < this.nn - 1) neighbors.push(idx + 1);

        return neighbors;
    }
    
    drawBoard() {
        let index = 0;
        
        const sudoku_board = $('<div></div>').addClass('sudoku_board');
        
        $('#' + this.id).empty();
        
        // Draw board 
        for (let i = 0; i < this.nn; i++) {
            for (let j = 0; j < this.nn; j++) {
                const position = { x: i + 1, y: j + 1 };
                const group_position = { 
                    x: Math.floor((position.x - 1) / this.n), 
                    y: Math.floor((position.y - 1) / this.n) 
                };
                
                let displayValue = '';
                if (this.board[index] > 0) {
                    if (this.mode === 'symbol') {
                        displayValue = this.symbols[this.board[index]];
                    } else {
                        displayValue = this.board[index];
                    }
                }
                
                const cell = $('<div></div>')
                    .addClass('cell')
                    .attr('data-x', position.x)
                    .attr('data-y', position.y)
                    .attr('data-idx', index) // Add data-idx for easy lookup
                    .attr('data-gr', group_position.x + '' + group_position.y)
                    .html('<span>' + displayValue + '</span>');
                
                if (this.board[index] > 0) { // If a number is pre-filled
                    cell.addClass('fix'); // Mark as fixed
                }
                
                // Standard Sudoku 3x3 block borders
                if (position.x % this.n === 0 && position.x != this.nn) {
                    cell.addClass('border_h');
                }
                
                if (position.y % this.n === 0 && position.y != this.nn) {
                    cell.addClass('border_v');
                }

                // Killer Sudoku specific rendering
                if (this.mode === 'killer') {
                    const currentCellIndex = index;
                    const cageId = this.cageMap[currentCellIndex];
                    const cage = this.cages.find(c => c.id === cageId);

                    if (cage) {
                        // Determine if this cell is the top-leftmost in its cage to display the sum
                        const minIdxInCage = Math.min(...cage.cells);
                        if (currentCellIndex === minIdxInCage) {
                            cell.append(`<div class="cage-sum">${cage.sum}</div>`);
                        }

                        // Apply cage borders (dashed lines)
                        const row = Math.floor(currentCellIndex / this.nn);
                        const col = currentCellIndex % this.nn;

                        // Check top border
                        if (row === 0 || this.cageMap[currentCellIndex - this.nn] !== cageId) {
                            cell.addClass('cage-border-top');
                        }
                        // Check bottom border
                        if (row === this.nn - 1 || this.cageMap[currentCellIndex + this.nn] !== cageId) {
                            cell.addClass('cage-border-bottom');
                        }
                        // Check left border
                        if (col === 0 || this.cageMap[currentCellIndex - 1] !== cageId) {
                            cell.addClass('cage-border-left');
                        }
                        // Check right border
                        if (col === this.nn - 1 || this.cageMap[currentCellIndex + 1] !== cageId) {
                            cell.addClass('cage-border-right');
                        }
                    }
                }
                
                cell.appendTo(sudoku_board);
                index++;
            }
        }
        
        sudoku_board.appendTo('#' + this.id);
        
        // Update stats
        this.cellsComplete = $(`#${this.id} .sudoku_board .cell span:not(:empty)`).length;
        $('.cells_complete').text(this.cellsComplete + '/' + this.cellsNr);
        $('.hints').text(this.hintsLeft);
        
        this.resizeWindow();
    }
    
    resizeWindow() {
        const boardWidth = $('#' + this.id + ' .sudoku_board').width();
        const cellWidth = boardWidth / 9;
        
        $('#' + this.id + ' .sudoku_board .cell').css({
            'width': cellWidth + 'px',
            'height': cellWidth + 'px',
            'line-height': cellWidth + 'px'
        });
        
        $('#' + this.id + ' .sudoku_board .cell span').css('line-height', cellWidth + 'px');
        
        const noteSize = cellWidth / 3 - 2;
        $('#' + this.id + ' .sudoku_board .cell .note').css({
            'width': noteSize + 'px',
            'height': noteSize + 'px',
            'line-height': noteSize + 'px',
            'font-size': noteSize * 0.6 + 'px'
        });
    }
    
    cellSelect(cell) {
        this.cell = cell;
        
        const value = parseInt($(cell).find('span').text()) || 0; // Use parseInt for value
        const position = { 
            x: parseInt($(cell).attr('data-x')), 
            y: parseInt($(cell).attr('data-y')) 
        };
        const group_position = { 
            x: Math.floor((position.x - 1) / this.n), 
            y: Math.floor((position.y - 1) / this.n) 
        };
        
        // Get elements for highlighting
        const horizontal_cells = $(`#${this.id} .sudoku_board .cell[data-x="${position.x}"]`);
        const vertical_cells = $(`#${this.id} .sudoku_board .cell[data-y="${position.y}"]`);
        const group_cells = $(`#${this.id} .sudoku_board .cell[data-gr="${group_position.x}${group_position.y}"]`);
        
        // Remove all other selections
        $(`#${this.id} .sudoku_board .cell`).removeClass('selected current group cage-highlight');
        $(`#${this.id} .sudoku_board .cell span`).removeClass('samevalue');
        
        // Select current cell
        $(cell).addClass('selected current');
        
        // Highlight cells with the same value
        if (this.highlight > 0 && value > 0) {
            $(`#${this.id} .sudoku_board .cell span`).filter(function() {
                return parseInt($(this).text()) === value;
            }).not($(cell).find('span')).addClass('samevalue');
        }
        
        if (this.highlight > 0) {
            horizontal_cells.addClass('selected'); // Re-added
            vertical_cells.addClass('selected');   // Re-added
            group_cells.addClass('selected group');
        }

        // Killer Sudoku: Highlight the entire cage
        if (this.mode === 'killer') {
            const currentCellIndex = parseInt($(cell).attr('data-idx'));
            const cageId = this.cageMap[currentCellIndex];
            const cage = this.cages.find(c => c.id === cageId);
            if (cage) {
                cage.cells.forEach(idx => {
                    $(`#${this.id} .sudoku_board .cell[data-idx="${idx}"]`).addClass('selected cage-highlight');
                });
            }
        }
    }
    
    addValue(value) {
        if (!this.cell || $(this.cell).hasClass('fix')) {
            return this;
        }
        
        const currentCellIndex = parseInt($(this.cell).attr('data-idx'));
        
        // Update internal board array
        this.board[currentCellIndex] = value;

        // Display value
        let displayVal = '';
        if (value !== 0) {
            if (this.mode === 'symbol') {
                displayVal = this.symbols[value];
            } else {
                displayVal = value;
            }
        }
        $(this.cell).find('span').text(displayVal);
        
        // Remove all notes from current cell
        $(this.cell).find('.note').remove();
        
        // Revalidate the board after value change
        this.revalidateBoard();
        
        // Recalculate completed cells
        this.cellsComplete = $(`#${this.id} .sudoku_board .cell span:not(:empty)`).length;
        $('.cells_complete').text(`${this.cellsComplete}/${this.cellsNr}`);
        
        // Game over
        if (this.cellsComplete === this.cellsNr && this.isBoardValid()) {
            this.gameOver();
        }
        
        return this;
    }
    
    addNote(value) {
        if (!this.cell || $(this.cell).hasClass('fix') || $(this.cell).find('span').text() !== '') {
            return this;
        }
        
        const oldNotes = $(this.cell).find('.note');
        
        // Add note to cell if it doesn't already exist and we have space
        if (oldNotes.length < 9 && !$(this.cell).find(`.note:contains(${value})`).length) {
            const noteSize = $(this.cell).width() / 3 - 2;
            const noteContent = this.mode === 'symbol' ? this.symbols[value] : value;
            
            $('<div></div>')
                .addClass('note')
                .css({
                    'line-height': noteSize + 'px',
                    'height': noteSize + 'px',
                    'width': noteSize + 'px',
                    'font-size': noteSize * 0.6 + 'px'
                })
                .text(noteContent)
                .appendTo(this.cell);
        }
        
        return this;
    }
    
    removeNote(value) {
        if (!this.cell) return this;

        if (value === 0) { // Delete all notes
            $(this.cell).find('.note').remove();
        } else { // Delete specific note
            const noteContent = this.mode === 'symbol' ? this.symbols[value] : value;
            $(this.cell).find(`.note:contains(${noteContent})`).remove();
        }
        return this;
    }

    // --- Validation Logic ---
    revalidateBoard() {
        // Clear all 'notvalid' classes first
        $(`#${this.id} .sudoku_board .cell`).removeClass('notvalid');

        for (let i = 0; i < this.cellsNr; i++) {
            const cellElement = $(`#${this.id} .sudoku_board .cell[data-idx="${i}"]`);
            const value = this.board[i];
            if (value === 0) continue; // Skip empty cells for validation

            const row = Math.floor(i / this.nn);
            const col = i % this.nn;
            const group_row = Math.floor(row / this.n);
            const group_col = Math.floor(col / this.n);

            let cellIsInvalid = false;

            // Check row for duplicates
            for (let j = 0; j < this.nn; j++) {
                const otherIdx = row * this.nn + j;
                if (otherIdx !== i && this.board[otherIdx] === value) {
                    cellIsInvalid = true;
                    break;
                }
            }
            if (cellIsInvalid) { cellElement.addClass('notvalid'); continue; }

            // Check column for duplicates
            for (let j = 0; j < this.nn; j++) {
                const otherIdx = j * this.nn + col;
                if (otherIdx !== i && this.board[otherIdx] === value) {
                    cellIsInvalid = true;
                    break;
                }
            }
            if (cellIsInvalid) { cellElement.addClass('notvalid'); continue; }

            // Check 3x3 group for duplicates
            const startRow = group_row * this.n;
            const startCol = group_col * this.n;
            for (let r = 0; r < this.n; r++) {
                for (let c = 0; c < this.n; c++) {
                    const otherIdx = (startRow + r) * this.nn + (startCol + c);
                    if (otherIdx !== i && this.board[otherIdx] === value) {
                        cellIsInvalid = true;
                        break;
                    }
                }
                if (cellIsInvalid) break;
            }
            if (cellIsInvalid) { cellElement.addClass('notvalid'); continue; }

            // Killer Sudoku specific validation
            if (this.mode === 'killer') {
                const cageId = this.cageMap[i];
                const cage = this.cages.find(c => c.id === cageId);
                if (cage) {
                    let currentCageSum = 0;
                    const cageCellValues = [];
                    let hasEmptyCellsInCage = false;

                    cage.cells.forEach(idx => {
                        const val = this.board[idx];
                        if (val !== 0) {
                            currentCageSum += val;
                            cageCellValues.push(val);
                        } else {
                            hasEmptyCellsInCage = true;
                        }
                    });

                    // Check for duplicates within the cage
                    if (new Set(cageCellValues).size !== cageCellValues.length) {
                        cellIsInvalid = true;
                    }

                    // Check cage sum only if all cells in the cage are filled
                    if (!hasEmptyCellsInCage && currentCageSum !== cage.sum) {
                        cellIsInvalid = true;
                    }
                }
            }
            
            if (cellIsInvalid) {
                cellElement.addClass('notvalid');
            }
        }
    }

    isBoardValid() {
        // Check if any cell is marked as notvalid
        if ($(`#${this.id} .sudoku_board .cell.notvalid`).length > 0) {
            return false;
        }

        // Check if all cells are filled
        if (this.cellsComplete !== this.cellsNr) {
            return false;
        }

        // Perform a final comprehensive check (redundant if revalidateBoard is perfect, but safer)
        for (let i = 0; i < this.cellsNr; i++) {
            const value = this.board[i];
            const row = Math.floor(i / this.nn);
            const col = i % this.nn;
            const group_row = Math.floor(row / this.n);
            const group_col = Math.floor(col / this.n);

            // Check row
            const rowValues = [];
            for (let j = 0; j < this.nn; j++) {
                rowValues.push(this.board[row * this.nn + j]);
            }
            // Filter out zeros before checking for duplicates in a full board check
            if (new Set(rowValues.filter(v => v !== 0)).size !== rowValues.filter(v => v !== 0).length) return false;

            // Check column
            const colValues = [];
            for (let j = 0; j < this.nn; j++) {
                colValues.push(this.board[j * this.nn + col]);
            }
            if (new Set(colValues.filter(v => v !== 0)).size !== colValues.filter(v => v !== 0).length) return false;

            // Check 3x3 group
            const groupValues = [];
            const startRow = group_row * this.n;
            const startCol = group_col * this.n;
            for (let r = 0; r < this.n; r++) {
                for (let c = 0; c < this.n; c++) {
                    groupValues.push(this.board[(startRow + r) * this.nn + (startCol + c)]);
                }
            }
            if (new Set(groupValues.filter(v => v !== 0)).size !== groupValues.filter(v => v !== 0).length) return false;

            // Killer Sudoku specific check
            if (this.mode === 'killer') {
                const cageId = this.cageMap[i];
                const cage = this.cages.find(c => c.id === cageId);
                if (cage) {
                    let currentCageSum = 0;
                    const cageCellValues = [];
                    cage.cells.forEach(idx => {
                        currentCageSum += this.board[idx];
                        cageCellValues.push(this.board[idx]);
                    });
                    if (new Set(cageCellValues.filter(v => v !== 0)).size !== cageCellValues.filter(v => v !== 0).length) return false; // Duplicates in cage
                    if (currentCageSum !== cage.sum) return false; // Incorrect cage sum
                }
            }
        }
        return true;
    }
    
    useHint() {
        if (this.hintsLeft <= 0 || !this.cell || $(this.cell).hasClass('fix') || $(this.cell).find('span').text() !== '') {
            return;
        }
        
        const index = parseInt($(this.cell).attr('data-idx'));
        const solution = this.boardSolution[index];
        
        if (solution) {
            this.addValue(solution);
            this.hintsLeft--;
            $('.hints').text(this.hintsLeft);
        }
    }
    
    gameOver() {
        this.status = this.END;
        clearInterval(this.timerInterval);
        
        const minutes = Math.floor(this.secondsElapsed / 60);
        const seconds = this.secondsElapsed % 60;
        const finalTimeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update the leaderboard with the new score, passing mode and difficulty
        updateLeaderboard(finalTimeStr, this.mode, this.difficulty);
        
        // Show the leaderboard in the game over modal
        const gameOverLeaderboardList = $('#game_over_modal #leaderboard_list');
        gameOverLeaderboardList.empty();
        // Retrieve the specific leaderboard for the completed mode and difficulty
        const currentDifficultyLeaderboard = JSON.parse(localStorage.getItem(`sudoku_leaderboard_${this.mode}_${this.difficulty}`)) || [];
        currentDifficultyLeaderboard.forEach((time, idx) => {
            const scoreClass = (time === '00:00') ? 'placeholder-score' : '';
            gameOverLeaderboardList.append(`<li class="${scoreClass}"><strong>#${idx + 1}</strong> <span>${time}</span></li>`);
        });

        $('.final-time').text(finalTimeStr);
        $('#game_over_modal').addClass('open');
    }
    
    run() {
        this.status = this.RUNNING;
        this.secondsElapsed = 0;
        this.drawBoard();
        this.updateControls();
        this.revalidateBoard(); // Initial validation check
        
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => this.timer(), 1000);
    }
}

// Leaderboard functions (outside Sudoku class, as they interact with localStorage and UI directly)

// Function to initialize leaderboards with placeholder data if empty
function initializeLeaderboards() {
    const difficulties = ['easy', 'medium', 'hard'];
    const modes = ['classic', 'symbol', 'killer']; // Add all game modes
    
    modes.forEach(mode => {
        difficulties.forEach(difficulty => {
            const key = `sudoku_leaderboard_${mode}_${difficulty}`; // Key now includes mode
            let leaderboard = JSON.parse(localStorage.getItem(key));
            if (!leaderboard || leaderboard.length === 0) {
                leaderboard = Array(5).fill('00:00'); 
                localStorage.setItem(key, JSON.stringify(leaderboard));
            }
        });
    });
}

// Helper function to convert MM:SS string to seconds for comparison
function timeToSeconds(timeStr) {
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// Helper function to convert seconds back to MM:SS string
function secondsToTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// updateLeaderboard now takes mode as an argument
function updateLeaderboard(newTimeStr, mode, difficulty) {
    const key = `sudoku_leaderboard_${mode}_${difficulty}`; // Key now includes mode
    let leaderboard = JSON.parse(localStorage.getItem(key)) || [];
    
    // 1. Filter out '00:00' placeholders and convert real times to seconds for accurate sorting
    let realScoresInSeconds = leaderboard
        .filter(score => score !== '00:00')
        .map(timeToSeconds);

    // 2. Add the new score (converted to seconds)
    const newScoreInSeconds = timeToSeconds(newTimeStr);
    realScoresInSeconds.push(newScoreInSeconds);

    // 3. Sort all real scores from fastest to slowest
    realScoresInSeconds.sort((a, b) => a - b); // Sort numerically ascending

    // 4. Take only the top 5 real scores
    let top5RealScores = realScoresInSeconds.slice(0, 5);

    // 5. Convert back to MM:SS string format
    let updatedLeaderboard = top5RealScores.map(secondsToTime);

    // 6. Fill with '00:00' placeholders if there are less than 5 real scores
    while (updatedLeaderboard.length < 5) {
        updatedLeaderboard.push('00:00');
    }
    
    // 7. Re-sort one last time to ensure '00:00' placeholders are at the end if they were added
    // This is important if a real score was added that was slower than existing placeholders.
    // We want real scores first, then placeholders.
    updatedLeaderboard.sort((a, b) => {
        const valA = (a === '00:00') ? Infinity : timeToSeconds(a);
        const valB = (b === '00:00') ? Infinity : timeToSeconds(b);
        return valA - valB;
    });

    localStorage.setItem(key, JSON.stringify(updatedLeaderboard));
    return updatedLeaderboard;
}

// showLeaderboard now takes mode and difficulty as arguments
function showLeaderboard(mode, difficulty) {
    const key = `sudoku_leaderboard_${mode}_${difficulty}`; // Key now includes mode
    const leaderboard = JSON.parse(localStorage.getItem(key)) || [];
    // Select the correct list element based on mode and difficulty
    const list = $(`#leaderboard_modal #${mode}_${difficulty}_list`); // Adjusted selector
    list.empty();
    
    if (leaderboard.length === 0) {
        list.append('<li>No scores yet.</li>'); 
    } else {
        leaderboard.forEach((time, idx) => {
            const scoreClass = (time === '00:00') ? 'placeholder-score' : '';
            list.append(`<li class="${scoreClass}"><strong>#${idx + 1}</strong> <span>${time}</span></li>`);
        });
    }
}

// showFullLeaderboard now takes currentMode as an argument
function showFullLeaderboard(currentMode) {
    initializeLeaderboards(); 

    const difficulties = ['easy', 'medium', 'hard'];
    const allModes = ['classic', 'symbol', 'killer']; // All game modes

    // Clear existing content in the modal first
    const modalContent = $('#leaderboard_modal .modal-content');
    modalContent.empty();
    modalContent.append('<h2>🏆 Leaderboard</h2>');

    // Only display the leaderboard for the currentMode
    const modesToDisplay = allModes.filter(mode => mode === currentMode);

    modesToDisplay.forEach(mode => {
        modalContent.append(`<h3>${mode.charAt(0).toUpperCase() + mode.slice(1)} Sudoku</h3>`);
        difficulties.forEach(difficulty => {
            // Create a container for each mode-difficulty combination
            const listId = `${mode}_${difficulty}_list`; // Unique ID for each list
            const sectionTitle = `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
            modalContent.append(`
                <div>
                    <h4>${sectionTitle}</h4>
                    <ul id="${listId}" class="leaderboard-list"></ul>
                </div>
            `);
            showLeaderboard(mode, difficulty); // Populate the list
        });
    });
    
    modalContent.append('<button id="close_leaderboard" class="modal-btn primary">Close</button>');
    // Re-attach event listener for the dynamically added close button
    $('#close_leaderboard').on('click', function() {
        $('#leaderboard_modal').removeClass('open');
    });

    $('#leaderboard_modal').addClass('open');
}

// Main game initialization
$(document).ready(function() {
    let game;
    let selectedMode = 'classic'; // Track selected game mode
    const backgroundMusic = $('#background_music')[0]; // Get the audio element

    // --- Local Storage Management for Settings ---
    function loadSettings() {
        const savedTheme = localStorage.getItem('sudoku_theme') || 'primary';
        applyTheme(savedTheme);

        const savedMusicState = localStorage.getItem('sudoku_music_enabled');
        if (savedMusicState === null) { // First time load, default to true
            $('#music_toggle').prop('checked', true);
            backgroundMusic.volume = 0.5; // Default volume
        } else {
            const isMusicEnabled = JSON.parse(savedMusicState);
            $('#music_toggle').prop('checked', isMusicEnabled);
            if (isMusicEnabled) {
                backgroundMusic.play().catch(e => console.log("Music auto-play blocked:", e));
            } else {
                backgroundMusic.pause();
            }
        }
    }

    function saveSettings() {
        localStorage.setItem('sudoku_music_enabled', $('#music_toggle').prop('checked'));
        // Theme is saved directly by applyTheme
    }

    function applyTheme(themeName) {
        $('body').removeClass('theme-primary theme-dark theme-light').addClass('theme-' + themeName);
        $('.theme-box').removeClass('active');
        $(`.theme-box[data-theme="${themeName}"]`).addClass('active');
        localStorage.setItem('sudoku_theme', themeName);
    }

    // Call this function once when the app loads to ensure leaderboards exist
    initializeLeaderboards();
    loadSettings(); // Load settings on startup

    // Initially show startup, hide game
    $('#startup_screen').show();
    $('.game-container').hide();
    $('#symbol_legend').hide();

    /// --- Startup & Difficulty Flow ---
    $('#start_classic_btn').on('click', () => {
        selectedMode = 'classic';
        $('#difficulty_modal').addClass('open');
    });

    $('.difficulty-btn-modal').on('click', function () {
        const level = $(this).data('level');
        $('#difficulty_modal').removeClass('open');
        
        const isInitial = !game;
        if (isInitial) {
            $('#startup_screen').hide();
            $('.game-container').show();
            game = new Sudoku({ 
                id: 'sudoku_container', 
                highlight: 1,
                mode: selectedMode
            });
        }
        
        game.difficulty = level;
        game.setMode(selectedMode);
        game.init().run();
    });

    $('#close_difficulty').on('click', () => {
        $('#difficulty_modal').removeClass('open');
    });

    // --- Game Modes & Settings ---
    $('#game_modes_btn').on('click', () => {
        $('#game_modes_modal').addClass('open');
    });

    $('.game-mode-btn').on('click', function() {
        const mode = $(this).data('mode');
        
        if (mode === 'symbol' || mode === 'killer') {
            $('#game_modes_modal').removeClass('open');
            selectedMode = mode;
            $('#difficulty_modal').addClass('open');
        } else {
            // This block seems to be for a "coming soon" feature, not actual mode selection
            // If you intend for this button to select a mode, its logic needs adjustment.
            $(this).html(`<i class="fas fa-clock"></i> ${$(this).text()} (Coming Soon!)`);
            $(this).css('background-color', '#b2bec3').prop('disabled', true);
            
            setTimeout(() => {
                $('#game_modes_modal').removeClass('open');
                $('.game-mode-btn').html(function() {
                    const btnMode = $(this).data('mode');
                    if(btnMode === 'symbol') {
                        return '<i class="fas fa-shapes"></i> Symbol Sudoku';
                    } else if (btnMode === 'killer') {
                        return '<i class="fas fa-calculator"></i> Killer Sudoku';
                    }
                    return $(this).text(); // Fallback
                }).css('background-color', '').prop('disabled', false);
            }, 2000);
        }
    });

    $('#close_game_modes').on('click', () => {
        $('#game_modes_modal').removeClass('open');
    });

    $('#settings_btn_main').on('click', () => $('#side_menu').addClass('open'));

    // --- Side Menu Toggles & Game Controls ---
    $('#menu_toggle').on('click', () => $('#side_menu').addClass('open'));
    $('#close_menu').on('click', () => $('#side_menu').removeClass('open'));
    
    $('#home_btn').on('click', function () {
        // Hide the game interface
        $('.game-container').hide();

        // Clear the Sudoku board
        $('#sudoku_container').empty();

        // Close the side menu
        $('#side_menu').removeClass('open');

        // Show the startup screen
        $('#startup_screen').show();

        // Reset the game object and clear timer
        if (game) {
            clearInterval(game.timerInterval);
            game = null;
        }
    });

    $('#restart_game_btn').on('click', function() {
        $('#side_menu').removeClass('open');
        if (game) {
            game.init().run();
        }
    });
    
    $('#change_difficulty_btn').on('click', function() {
        $('#side_menu').removeClass('open');
        $('#difficulty_modal').addClass('open');
    });

    // --- How to Play Modal ---
    $('#help_btn, #how_to_play_btn').on('click', () => {
        // Determine which instructions to show based on current game mode
        $('.instructions').removeClass('active'); // Hide all first
        if (game && game.mode === 'killer') {
            $('#killer_sudoku_instructions').addClass('active');
        } else {
            $('#classic_sudoku_instructions').addClass('active');
        }
        $('#how_to_play_modal').addClass('open');
    });
    $('#close_how_to_play').on('click', () => $('#how_to_play_modal').removeClass('open'));

    // --- Leaderboard Modals ---
    $('#view_leaderboard_btn, #view_leaderboard_btn_header').on('click', function() {
        $('#side_menu').removeClass('open'); // Close side menu if opened from there
        // Pass the current game mode to showFullLeaderboard
        // If game is running, use game.mode, otherwise use selectedMode from startup
        const modeToShow = game ? game.mode : selectedMode;
        showFullLeaderboard(modeToShow); 
    });
    // The close_leaderboard button is now dynamically added in showFullLeaderboard,
    // so its event listener is attached there.

    // --- Game Over & Replay ---
    $('#play_again_btn').on('click', function() {
        $('#game_over_modal').removeClass('open');
        if (game) {
            game.init().run();
        }
    });
    $('#new_game_modal_btn').on('click', function() {
        $('#game_over_modal').removeClass('open');
        // Go back to startup screen to choose new mode/difficulty
        $('#startup_screen').show();
        $('.game-container').hide();
        $('#sudoku_container').empty();
        if (game) {
            clearInterval(game.timerInterval);
            game = null;
        }
    });


    // --- Notes & Hints ---
    $('#note_toggle').on('click', function() {
        if (game) {
            game.markNotes = !game.markNotes;
            $(this).toggleClass('active');
        }
    });
    $('#hint_btn').on('click', () => {
        if (game) game.useHint();
    });

    // --- Number Pad & Cell Selection ---
    $('.num-btn').on('click', function() {
        if (!game) return;
        
        const val = parseInt($(this).data('value')) || 0;
        if (game.markNotes) {
            if ($(this).hasClass('active')) {
                game.removeNote(val);
                $(this).removeClass('active');
            } else {
                game.addNote(val);
                $(this).addClass('active');
            }
        } else {
            game.addValue(val);
        }
    });
    $('#sudoku_container').on('click', '.cell', function() {
        if (game) game.cellSelect(this);
    });
    
    // Symbol legend click handler
    $('#symbol_legend').on('click', '.legend-item', function() {
        if (!game) return;
        
        const value = parseInt($(this).data('value'));
        
        if (game.markNotes) {
            game.addNote(value);
        } else {
            game.addValue(value);
        }
    });

    // --- New Settings Event Listeners ---
    $('#music_toggle').on('change', function() {
        if ($(this).is(':checked')) {
            backgroundMusic.play().catch(e => console.log("Music auto-play prevented:", e));
        } else {
            backgroundMusic.pause();
        }
        saveSettings();
    });

    $('.theme-box').on('click', function() {
        const theme = $(this).data('theme');
        applyTheme(theme);
    });

    $('#reset_progress_btn').on('click', function() {
        $('#confirm_reset_modal').addClass('open');
    });

    $('#confirm_reset_yes').on('click', function() {
        localStorage.clear(); // Clears all local storage data
        initializeLeaderboards(); // Re-initialize leaderboards with placeholders
        $('#confirm_reset_modal').removeClass('open');
        $('#side_menu').removeClass('open');
        alert('All progress has been reset!');
        // Optionally, reload the page or reset game state
        location.reload(); 
    });

    $('#confirm_reset_no').on('click', function() {
        $('#confirm_reset_modal').removeClass('open');
    });
});