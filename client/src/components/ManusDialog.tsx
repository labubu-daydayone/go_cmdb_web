import { useEffect, useState } from "react";
import { Button, Dialog, DialogContent, DialogActions, Typography, Box } from "@/components/mui";

interface ManusDialogProps {
  title?: string;
  logo?: string;
  open?: boolean;
  onLogin: () => void;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function ManusDialog({
  title,
  logo,
  open = false,
  onLogin,
  onOpenChange,
  onClose,
}: ManusDialogProps) {
  const [internalOpen, setInternalOpen] = useState(open);

  useEffect(() => {
    if (!onOpenChange) {
      setInternalOpen(open);
    }
  }, [open, onOpenChange]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }

    if (!nextOpen) {
      onClose?.();
    }
  };

  return (
    <Dialog
      open={onOpenChange ? open : internalOpen}
      onClose={() => handleOpenChange(false)}
      PaperProps={{
        sx: {
          borderRadius: '20px',
          width: '400px',
          backgroundColor: '#f8f8f7',
          boxShadow: '0px 4px 11px 0px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.08)',
          backdropFilter: 'blur(32px)',
        }
      }}
    >
      <DialogContent sx={{ textAlign: 'center', pt: 6, pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {logo && (
            <Box
              sx={{
                width: 64,
                height: 64,
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img src={logo} alt="Dialog graphic" style={{ width: 40, height: 40, borderRadius: '6px' }} />
            </Box>
          )}

          {title && (
            <Typography
              variant="h6"
              sx={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#34322d',
                lineHeight: '26px',
                letterSpacing: '-0.44px',
              }}
            >
              {title}
            </Typography>
          )}
          
          <Typography
            variant="body2"
            sx={{
              fontSize: '14px',
              color: '#858481',
              lineHeight: '20px',
              letterSpacing: '-0.154px',
            }}
          >
            Please login with Manus to continue
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2.5 }}>
        <Button
          onClick={onLogin}
          variant="default"
          sx={{
            width: '100%',
            height: '40px',
            backgroundColor: '#1a1a19',
            '&:hover': {
              backgroundColor: 'rgba(26, 26, 25, 0.9)',
            },
            color: 'white',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: '20px',
            letterSpacing: '-0.154px',
          }}
        >
          Login with Manus
        </Button>
      </DialogActions>
    </Dialog>
  );
}
