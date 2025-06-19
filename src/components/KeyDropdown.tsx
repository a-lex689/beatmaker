import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 15px;
  flex: 1;
`;

const Label = styled.label`
  font-size: 14px;
  margin-bottom: 8px;
  color: #ccc;
`;

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
`;

const DropdownButton = styled.button`
  width: 100%;
  padding: 10px 12px;
  background-color: #1e1e1e;
  color: white;
  border: 1px solid #333;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:hover {
    background-color: #2a2a2a;
  }
  
  &:focus {
    outline: none;
    border-color: #1DB954;
  }
`;

const DropdownArrow = styled.span`
  margin-left: 10px;
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background-color: #1e1e1e;
  border: 1px solid #333;
  border-radius: 4px;
  z-index: 10;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  margin-top: 4px;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1e1e1e;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #333;
    border-radius: 4px;
    border: 2px solid #1e1e1e;
  }
`;

const DropdownItem = styled.div<{ $isSelected: boolean }>`
  padding: 10px 12px;
  cursor: pointer;
  background-color: ${props => props.$isSelected ? '#333' : 'transparent'};
  color: ${props => props.$isSelected ? '#1DB954' : 'white'};

  &:hover {
    background-color: #333;
  }
`;

interface KeyDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const KeyDropdown: React.FC<KeyDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // List of musical keys
  const keys = [
    'C Major', 'C Minor',
    'C# Major', 'C# Minor',
    'D Major', 'D Minor',
    'D# Major', 'D# Minor',
    'E Major', 'E Minor',
    'F Major', 'F Minor',
    'F# Major', 'F# Minor',
    'G Major', 'G Minor',
    'G# Major', 'G# Minor',
    'A Major', 'A Minor',
    'A# Major', 'A# Minor',
    'B Major', 'B Minor'
  ];
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const handleItemClick = (key: string) => {
    onChange(key);
    setIsOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <Container>
      <Label>Key</Label>
      <DropdownContainer ref={dropdownRef}>
        <DropdownButton onClick={toggleDropdown}>
          {value}
          <DropdownArrow>{isOpen ? '▲' : '▼'}</DropdownArrow>
        </DropdownButton>

        <DropdownMenu $isOpen={isOpen}>
          {keys.map((key) => (
            <DropdownItem
              key={key}
              $isSelected={value === key}
              onClick={() => handleItemClick(key)}
            >
              {key}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </DropdownContainer>
    </Container>
  );
};

export default KeyDropdown;