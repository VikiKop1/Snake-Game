class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  collide(cell) {
    if (this.x === cell.x && this.y === cell.y) {
      this.bump(cell);
    }
  }

  bump(cell) {
  }

  destroy() {
  }
}

class SnakeTail extends Cell {
  constructor(x, y) {
    super(x, y);
  }
}

class SnakeHead extends Cell {
  constructor(x, y, game) {
    super(x, y);
    this.game = game;
    this.score = 0;
    this.lives = 3;
    this.direction = { dx: 1, dy: 0 }; 
  }

  bump(cell) {
    if (cell instanceof SnakeTail || cell instanceof Border) {
      this.lives -= 1;
      if (this.lives <= 0) {
        this.game.gameOver();
      }
    }
    if (cell instanceof Food) {
      this.score += 1;
      this.game.updateScore(this.score);
      cell.destroy();
      this.game.spawnFood();
    }
  }

  reset() {
    this.score = 0;
  }

  changeDirection(newDir) {
    if ((this.direction.dx + newDir.dx !== 0) || (this.direction.dy + newDir.dy !== 0)) {
      this.direction = newDir;
    }
  }
}

class Border extends Cell {
  constructor(x, y) {
    super(x, y);
  }
}

class Food extends Cell {
  constructor(x, y, game) {
    super(x, y);
    this.game = game;
  }

  bump(cell) {
    if (cell instanceof SnakeHead) {
      this.destroy();
    }
  }

  destroy() {
    const cellDiv = this.game.getCellDiv(this.x, this.y);
    cellDiv.classList.remove('apple');
  }
}

class Game {
  constructor() {
    this.size = 10;
    this.field = document.getElementById('gameField');
    this.scoreSpan = document.getElementById('score');
    this.recordContainer = document.getElementById('record-container');
    this.restartBtn = document.getElementById('restartBtn');

    this.cells = []; 
    this.snake = [];
    this.food = null;
    this.intervalId = null;
    this.isRunning = false;

    this.loadRecord();

    this.initField();
    this.createSnake();
    this.spawnFood();

    document.addEventListener('keydown', (e) => this.handleKey(e));
    this.field.addEventListener('click', () => this.startGame());
    this.restartBtn.addEventListener('click', () => this.resetGame());
  }

  loadRecord() {
    const record = localStorage.getItem('snakeRecord');
    if (record !== null) {
      this.record = parseInt(record, 10);
      this.recordContainer.textContent = `Лучший результат: ${this.record}`;
    } else {
      this.record = null;
    }
  }

  saveRecord(score) {
    if (this.record === null || score > this.record) {
      this.record = score;
      localStorage.setItem('snakeRecord', score);
      this.recordContainer.textContent = `Лучший результат: ${score}`;
    }
  }

  initField() {
    this.field.innerHTML = '';
    this.cells = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const div = document.createElement('div');
        div.className = 'cell';
        div.dataset.x = x;
        div.dataset.y = y;
        this.field.appendChild(div);
        if (!this.cells[y]) this.cells[y] = [];
        this.cells[y][x] = div;
      }
    }
  }

  getCellDiv(x, y) {
    x = (x + this.size) % this.size;
    y = (y + this.size) % this.size;
    return this.cells[y][x];
  }

  createSnake() {
    const startX = Math.floor(this.size / 2);
    const startY = Math.floor(this.size / 2);
    this.snake = [
      new SnakeHead(startX, startY, this),
      new SnakeTail(startX -1, startY),
    ];
    this.renderCell(this.snake[0].x, this.snake[0].y, 'snake');
    this.renderCell(this.snake[1].x, this.snake[1].y, 'snake');
  }

  startGame() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scoreSpan.textContent = '0';
    this.snake.forEach(s => this.renderCell(s.x, s.y, 'snake'));
    this.spawnFood();
    this.intervalId = setInterval(() => this.gameStep(), 500);
    this.restartBtn.style.display = 'none';
  }

  resetGame() {
    clearInterval(this.intervalId);
    this.isRunning = false;
    this.initField();
    this.createSnake();
    this.spawnFood();
    const head = this.snake[0];
    head.reset();
    this.updateScore(0);
    this.restartBtn.style.display = 'none';
  }

  gameOver() {
    clearInterval(this.intervalId);
    this.isRunning = false;
    const score = this.snake[0].score;
    this.saveRecord(score);
    alert(`Игра окончена! Ваш результат: ${score}`);
    this.restartBtn.style.display = 'block';
  }

  handleKey(e) {
    if (!this.isRunning) return;
    const keyMap = {
      'ArrowUp': { dx: 0, dy: -1 },
      'ArrowDown': { dx: 0, dy: 1 },
      'ArrowLeft': { dx: -1, dy: 0 },
      'ArrowRight': { dx: 1, dy: 0 },
    };
    const dir = keyMap[e.key];
    if (dir) {
      this.snake[0].changeDirection(dir);
    }
  }

  gameStep() {
    const head = this.snake[0];
    const newX = (head.x + head.direction.dx + this.size) % this.size;
    const newY = (head.y + head.direction.dy + this.size) % this.size;

    const isCollision = this.snake.some(segment => segment.x === newX && segment.y === newY);
    if (isCollision) {
      this.gameOver();
      return;
    }

    const newHead = new SnakeHead(newX, newY, this);
    this.snake.unshift(newHead);

    if (this.food && this.food.x === newX && this.food.y === newY) {
      this.spawnFood();
    } else {
      const tail = this.snake.pop();
      this.renderCell(tail.x, tail.y, '');
    }

    this.renderCell(newX, newY, 'snake');
  }

  renderCell(x, y, className) {
    const div = this.getCellDiv(x, y);
    div.className = 'cell ' + className;
  }

  spawnFood() {
    let x, y;
    do {
      x = Math.floor(Math.random() * this.size);
      y = Math.floor(Math.random() * this.size);
    } while (this.snake.some(s => s.x === x && s.y === y));

    this.food = new Food(x, y, this);
    const div = this.getCellDiv(x, y);
    div.classList.add('apple');
  }

  updateScore(score) {
    this.scoreSpan.textContent = score;
  }
}

const game = new Game();

document.querySelector('.game-field').addEventListener('click', () => {
  game.startGame();
});