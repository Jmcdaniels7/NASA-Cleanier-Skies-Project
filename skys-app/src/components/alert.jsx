import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

// Default API endpoint can be provided via environment variable REACT_APP_API_URL
const DEFAULT_API_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ? process.env.REACT_APP_API_URL : undefined;

const MuiAlertWrapper = React.forwardRef(function MuiAlertWrapper(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function OptinAlert({ onSubscribe, apiUrl: apiUrlProp }) {
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState('');
  const [areaError, setAreaError] = useState('');
  const [open, setOpen] = useState(false);
  const [lastPhone, setLastPhone] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  // Use prop apiUrl if provided, otherwise fall back to DEFAULT_API_URL
  const apiUrl = typeof apiUrlProp === 'string' && apiUrlProp.length > 0 ? apiUrlProp : DEFAULT_API_URL;


  const validatePhone = (value) => {
    // Simple US phone validation (allows optional +1)
    const re = /^\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
    return re.test(value.trim());
  };

  const validateArea = (value) => {
    // simple non-empty validation; adjust as needed
    return typeof value === 'string' && value.trim().length > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;
    if (!validatePhone(phone)) {
      setError('Enter a valid US phone number (e.g. +1-317-555-0123)');
      hasError = true;
    } else {
      setError('');
    }

    if (!validateArea(area)) {
      setAreaError('Area is required');
      hasError = true;
    } else {
      setAreaError('');
    }

    if (hasError) return;
    setLastPhone(phone);
  if (typeof onSubscribe === 'function') onSubscribe(phone, area);
  // show immediate UI feedback
  setSnackbarMessage("Subscribed! We'll send SMS alerts to " + phone + ".");
    setSnackbarSeverity('success');
    setOpen(true);

    // If apiUrl prop is set, try to POST phone to that endpoint and update snackbar
    if (typeof apiUrl === 'string' && apiUrl.length > 0) {
      setSnackbarMessage('Sending subscription to server...');
      setSnackbarSeverity('info');
      try {
        await sendPhoneToApi(phone);
        setSnackbarMessage("Subscribed! We'll send SMS alerts to " + phone + " (" + area + ").");
        setSnackbarSeverity('success');
      } catch (err) {
        setSnackbarMessage(`Failed to subscribe: ${err.message || 'server error'}`);
        setSnackbarSeverity('error');
      }
      setOpen(true);
    }

    setPhone('');
    setArea('');
  };

    const toggleHidden = () => setHidden(h => !h);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  // Helper to POST phone to backend. Throws on non-2xx responses.
  const sendPhoneToApi = async (phoneValue) => {
    if (typeof apiUrl !== 'string' || apiUrl.length === 0) {
      throw new Error('No apiUrl configured');
    }

    const payload = { phone: phoneValue, area };
    console.log('OptinAlert: sending to apiUrl=', apiUrl, 'payload=', payload);
    let res;
    try {
      res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (fetchErr) {
      console.error('OptinAlert fetch error:', fetchErr);
      throw fetchErr;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => null);
      console.error('OptinAlert: server error response', res.status, text);
      throw new Error(text || res.statusText || `HTTP ${res.status}`);
    }

    const json = await res.json().catch(() => ({}));
    console.log('OptinAlert: server responded', json);
    return json;
  };
  const formMarkup = (
    <form
      onSubmit={handleSubmit}
      aria-label="SMS opt-in form"
      style={{
        marginLeft: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        maxWidth: 800,
        flexWrap: 'wrap',
      }}
    >
      <TextField
        id="area-input"
        value={area}
        onChange={(e) => setArea(e.target.value)}
        placeholder="Area (e.g. Indianapolis)"
        error={!!areaError}
        helperText={areaError || ''}
        size="small"
        variant="outlined"
        inputProps={{ 'aria-label': 'area' }}
  FormHelperTextProps={{ style: { color: 'rgba(255,255,255,0.8)', minHeight: 20, lineHeight: '20px' } }}
        InputLabelProps={{ style: { color: '#fff' } }}
        InputProps={{
          style: { color: '#fff' },
        }}
        sx={{
            flex: '1 1 160px',
            minWidth: 120,
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.32)' },
              '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.48)' }
            },
            '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.6)' }
          }}
      />
      <TextField
        id="phone-input"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+1-317-999-9999"
        error={!!error}
  helperText={error || ''}
        size="small"
        variant="outlined"
        inputProps={{ 'aria-label': 'phone number' }}
  FormHelperTextProps={{ style: { color: 'rgba(255,255,255,0.8)', minHeight: 20, lineHeight: '20px' } }}
        InputLabelProps={{ style: { color: '#fff' } }}
        InputProps={{
          style: { color: '#fff' },
          notched: true,
        }}
        sx={{
          flex: '1 1 200px',
          minWidth: 140,
          '& .MuiOutlinedInput-root': {
            color: '#fff',
            '& fieldset': {
              borderColor: 'rgba(255,255,255,0.18)'
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255,255,255,0.32)'
            },
            '&.Mui-focused fieldset': {
              borderColor: 'rgba(255,255,255,0.48)'
            }
          },
          '& .MuiInputBase-input::placeholder': {
            color: 'rgba(255,255,255,0.6)'
          }
        }}
      />

      <Button
        type="submit"
        className="but"
        variant="outlined"
        sx={{
          alignSelf: 'center',
          height: 36,
          padding: '6px 12px',
          flex: '0 0 auto',
          color: '#fff',
          borderColor: 'rgba(255,255,255,0.18)',
          '&:hover': { borderColor: 'rgba(255,255,255,0.32)' }
        }}
      >
        Subscribe
      </Button>

      <Snackbar open={open} autoHideDuration={4000} onClose={handleClose}>
        <MuiAlertWrapper onClose={handleClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage || ("Subscribed! We'll send SMS alerts to " + lastPhone + ".")}
        </MuiAlertWrapper>
      </Snackbar>
    </form>
  );

  const containerStyle = {
    position: 'relative',
    paddingTop: 20,
    paddingRight: 50,
    display: 'flex',
    alignItems: 'flex-start',
    // only add extra space when the component is open so the fixed toggle doesn't overlap content
    ...(hidden ? { minHeight: 48 } : { paddingTop: 10, paddingRight: 10}),
  };

  return (
    <div style={containerStyle}>
      {/* hide/show toggle: use a fixed circular button so it remains visible when collapsed */}
      <button
        type="button"
        onClick={toggleHidden}
        aria-label={hidden ? 'show' : 'hide'}
        style={{
          position: 'absolute',
          top: 8,
          right: 2,
          zIndex: 1400,
          background: hidden ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.06)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          width: 36,
          height: 36,
          borderRadius: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: hidden ? '0 2px 8px rgba(0,0,0,0.35)' : 'none',
        }}
      >
        {hidden ? '+' : '-'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
        <span style={{ color: '#fff' }}>Opt-in for SMS alerts:</span>
        {!hidden && formMarkup}
      </div>
    </div>
  );
}

OptinAlert.propTypes = {
  onSubscribe: PropTypes.func,
  apiUrl: PropTypes.string,
};

OptinAlert.defaultProps = {
  onSubscribe: undefined,
  apiUrl: undefined,
};

export default OptinAlert;


