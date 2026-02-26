const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authStatusEl = document.getElementById('auth-status');

function setStatus(message, isError = false) {
  authStatusEl.textContent = message || '';
  authStatusEl.classList.toggle('error', Boolean(isError));
}

async function authRequest(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload)
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }

  return data;
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(loginForm).entries());

  try {
    setStatus('Logging in...');
    await authRequest('/api/auth/login', payload);
    window.location.href = '/app';
  } catch (error) {
    setStatus(error.message || 'Login failed.', true);
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(registerForm).entries());

  try {
    setStatus('Creating account...');
    await authRequest('/api/auth/register', payload);
    window.location.href = '/app';
  } catch (error) {
    setStatus(error.message || 'Account creation failed.', true);
  }
}

loginForm.addEventListener('submit', handleLoginSubmit);
registerForm.addEventListener('submit', handleRegisterSubmit);
