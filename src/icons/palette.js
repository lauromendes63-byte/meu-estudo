export const PALETTE_COLORS = [
  {
    key: 'navy',
    label: 'Azul Marinho',
    hex: '#162654',
    text: '#162654',
    bg: '#ECEFF6',
    border: '#CFD7E6',
    track: '#E3E6EC'
  },
  {
    key: 'blue',
    label: 'Azul Cobalto',
    hex: '#1F6C9F',
    text: '#18547D',
    bg: '#E4F1FA',
    border: '#C5E0F3',
    track: '#DCE7F0'
  },
  {
    key: 'emerald',
    label: 'Verde Botânico',
    hex: '#2F683A',
    text: '#26542F',
    bg: '#EDF3EC',
    border: '#CFE0CD',
    track: '#DFEAE0'
  },
  {
    key: 'purple',
    label: 'Lavanda Escura',
    hex: '#644496',
    text: '#50357A',
    bg: '#F3EEFA',
    border: '#DECFF2',
    track: '#E7E1F0'
  },
  {
    key: 'rose',
    label: 'Rosa Editorial',
    hex: '#A63252',
    text: '#882641',
    bg: '#FCEEF2',
    border: '#F3CFD9',
    track: '#EFE0E5'
  },
  {
    key: 'crimson',
    label: 'Carmim Clínico',
    hex: '#9F2F2D',
    text: '#842422',
    bg: '#FDEBEC',
    border: '#F2C9CB',
    track: '#EFE0E0'
  },
  {
    key: 'amber',
    label: 'Ocre Suave',
    hex: '#8C5B00',
    text: '#724900',
    bg: '#FBF3DB',
    border: '#E9DBA9',
    track: '#ECE6D3'
  },
  {
    key: 'cyan',
    label: 'Azul Petróleo',
    hex: '#136D7D',
    text: '#0F5663',
    bg: '#E3F4F6',
    border: '#BFE2E6',
    track: '#DAE9EB'
  },
  {
    key: 'orange',
    label: 'Terracota',
    hex: '#A24B18',
    text: '#863D12',
    bg: '#FCF0E6',
    border: '#F0D3BC',
    track: '#EFE4DA'
  },
  {
    key: 'teal',
    label: 'Verde Água',
    hex: '#1A6A62',
    text: '#14554E',
    bg: '#E6F4F1',
    border: '#C4E2DC',
    track: '#DCEAE7'
  },
  {
    key: 'indigo',
    label: 'Índigo Fosco',
    hex: '#3F4A9C',
    text: '#323B80',
    bg: '#ECEFFA',
    border: '#CFD6F2',
    track: '#E1E5F0'
  }
];

export function getColorConfig(colorKey) {
  return PALETTE_COLORS.find((c) => c.key === colorKey) || PALETTE_COLORS[0];
}

export function getIconSquircleStyle(colorObj) {
  const c = colorObj || PALETTE_COLORS[0];
  return `background-color: ${c.bg}; border-color: ${c.border}; color: ${c.hex};`;
}
