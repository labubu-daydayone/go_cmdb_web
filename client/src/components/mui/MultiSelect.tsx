/**
 * Material UI 多选选择器组件
 * 类似 Ant Design 的 Select mode="multiple"
 */

import { forwardRef } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  SelectChangeEvent,
  OutlinedInput,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export interface MultiSelectOption {
  label: string;
  value: string;
}

export interface MultiSelectProps {
  label?: string;
  placeholder?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: MultiSelectOption[];
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  className?: string;
}

const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      label,
      placeholder = 'Please select',
      value = [],
      onChange,
      options,
      disabled = false,
      fullWidth = true,
      size = 'small',
      className,
    },
    ref
  ) => {
    const handleChange = (event: SelectChangeEvent<string[]>) => {
      const selectedValue = event.target.value;
      onChange(typeof selectedValue === 'string' ? selectedValue.split(',') : selectedValue);
    };

    const handleDelete = (valueToDelete: string) => {
      onChange(value.filter((v) => v !== valueToDelete));
    };

    return (
      <FormControl ref={ref} fullWidth={fullWidth} size={size} disabled={disabled} className={className}>
        {label && <InputLabel>{label}</InputLabel>}
        <Select
          multiple
          value={value}
          onChange={handleChange}
          input={<OutlinedInput label={label} />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((val) => {
                const option = options.find((opt) => opt.value === val);
                return (
                  <Chip
                    key={val}
                    label={option?.label || val}
                    size="small"
                    onDelete={() => handleDelete(val)}
                    deleteIcon={
                      <CloseIcon
                        sx={{ fontSize: 14 }}
                        onMouseDown={(event: React.MouseEvent) => {
                          event.stopPropagation();
                        }}
                      />
                    }
                    sx={{
                      height: 24,
                      '& .MuiChip-deleteIcon': {
                        width: 14,
                        height: 14,
                      },
                    }}
                  />
                );
              })}
            </Box>
          )}
          displayEmpty
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 300,
              },
            },
          }}
        >
          {placeholder && value.length === 0 && (
            <MenuItem disabled value="">
              <em style={{ color: '#9ca3af' }}>{placeholder}</em>
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }
);

MultiSelect.displayName = 'MultiSelect';

export { MultiSelect };
