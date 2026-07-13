import React from 'react';
import { Text } from 'react-native';
import tw from 'twrnc';

interface PriceRangeProps {
  priceRange: { min: number; max: number } | undefined;
  styleClass?: string;
}

export function PriceRange({ priceRange, styleClass = '' }: PriceRangeProps) {
  if (!priceRange) return null;
  const { min, max } = priceRange;
  if (!min && !max) return null;

  const display =
    min > 0 && max > 0
      ? `${min}€ – ${max}€`
      : min > 0
      ? `από ${min}€`
      : max > 0
      ? `έως ${max}€`
      : null;

  if (!display) return null;

  return (
    <Text style={tw`text-black dark:text-white font-bold text-sm ${styleClass}`}>
      {display}
    </Text>
  );
}
