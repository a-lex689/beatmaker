import React from 'react';
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

const SliderContainer = styled.div`
  position: relative;
  height: 40px;
  display: flex;
  align-items: center;
`;

const SliderInput = styled.input`
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: #333;
  border-radius: 2px;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #1DB954;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #1DB954;
    cursor: pointer;
    transition: background 0.15s ease;
    border: none;
  }
  
  &::-webkit-slider-thumb:hover {
    background: #1ed760;
  }
  
  &::-moz-range-thumb:hover {
    background: #1ed760;
  }
`;

const ValueDisplay = styled.div`
  position: absolute;
  top: -10px;
  right: 0;
  background-color: #1DB954;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
`;

interface BpmSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const BpmSlider: React.FC<BpmSliderProps> = ({ 
  value, 
  onChange, 
  min = 80, 
  max = 180 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value, 10));
  };
  
  return (
    <Container>
      <Label>BPM</Label>
      <SliderContainer>
        <SliderInput 
          type="range" 
          min={min} 
          max={max} 
          value={value} 
          onChange={handleChange} 
        />
        <ValueDisplay>{value}</ValueDisplay>
      </SliderContainer>
    </Container>
  );
};

export default BpmSlider;