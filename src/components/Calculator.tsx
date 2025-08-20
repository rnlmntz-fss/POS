import React, { useState } from 'react';
import { X, Calculator as CalculatorIcon } from 'lucide-react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  if (!isOpen) return null;

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=']
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalculatorIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Calculator</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {/* Display */}
          <div className="bg-gray-900 text-white p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 text-right">
            <div className="text-2xl sm:text-3xl font-mono font-bold overflow-hidden">
              {display}
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-1 sm:gap-2">
            {buttons.flat().map((btn, index) => {
              const isOperator = ['÷', '×', '-', '+', '='].includes(btn);
              const isSpecial = ['C', '±', '%'].includes(btn);
              const isZero = btn === '0';
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (btn === 'C') {
                      clear();
                    } else if (btn === '=') {
                      handleEquals();
                    } else if (btn === '.') {
                      inputDecimal();
                    } else if (btn === '±') {
                      setDisplay(String(parseFloat(display) * -1));
                    } else if (btn === '%') {
                      setDisplay(String(parseFloat(display) / 100));
                    } else if (isOperator) {
                      performOperation(btn);
                    } else {
                      inputNumber(btn);
                    }
                  }}
                  className={`
                    h-12 sm:h-14 rounded-lg font-semibold text-base sm:text-lg transition-all
                    ${isZero ? 'col-span-2' : ''}
                    ${isOperator 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : isSpecial 
                        ? 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }
                    active:scale-95
                  `}
                >
                  {btn}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};