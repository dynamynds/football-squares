'use client';

import { useState } from 'react';
import styles from './GameGrid.module.css';

interface Square {
  index: number;
  owner: string | null;
  row: number;
  col: number;
}

export default function GameGrid() {
  const [squares, setSquares] = useState<Square[]>(() => {
    // Initialize 100 squares
    const initialSquares: Square[] = [];
    for (let i = 0; i < 100; i++) {
      initialSquares.push({
        index: i,
        owner: null,
        row: Math.floor(i / 10),
        col: i % 10
      });
    }
    return initialSquares;
  });

  const handleSquareClick = (square: Square) => {
    // TODO: Implement square purchase logic
    console.log('Square clicked:', square);
  };

  return (
    <div className={styles.gridContainer}>
      <div className={styles.grid}>
        {squares.map((square) => (
          <div
            key={square.index}
            className={`${styles.square} ${square.owner ? styles.taken : styles.available}`}
            onClick={() => handleSquareClick(square)}
          >
            <div className={styles.squareContent}>
              <span className={styles.coordinates}>
                {square.row},{square.col}
              </span>
              {square.owner && (
                <span className={styles.owner}>
                  {square.owner.slice(0, 6)}...{square.owner.slice(-4)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 