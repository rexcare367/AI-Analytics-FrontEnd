/* eslint-disable import/no-extraneous-dependencies */
import { useEffect, useState } from "react";
// @mui
import { Divider, Button, Stack, Alert } from '@mui/material';
import axios from 'axios';
import { useGoogleLogin  } from '@react-oauth/google';

// auth
import { useAuthContext } from '../../auth/useAuthContext';
// components
import Iconify from '../../components/iconify';

// ----------------------------------------------------------------------

export default function AuthLoginWithSocial() {
  const { loginWithGoogle } = useAuthContext();

  const [ user, setUser ] = useState([]);
  const [ errors, setErrors ] = useState({});

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => setUser(codeResponse),
    onError: (error) => console.log('Login Failed:', error)
  });

  useEffect(
    () => {
        if (user) {
            axios
                .get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
                    headers: {
                        Authorization: `Bearer ${user.access_token}`,
                        Accept: 'application/json'
                    }
                })
                .then(async (res) => {
                  try{
                    await loginWithGoogle(res.data.email);
                  }
                  catch(error) {
                    setErrors({
                      ...error,
                      message: error.message || error,
                    });
                  }
                  console.log(res.data);
                })
                .catch((err) => console.log(err));
        }
    },
    [loginWithGoogle, user]
  );

  return (
    <div>
      <Divider
        sx={{
          my: 2.5,
          typography: 'overline',
          color: 'text.disabled',
          '&::before, ::after': {
            borderTopStyle: 'dashed',
          },
        }}
      >
        OR
      </Divider>

      <Stack direction="column" justifyContent="center" spacing={2} alignItems="center">
        {!!errors.message && <Alert className="w-full" severity="error">{errors.message}</Alert>}

        <Button
            color="inherit"
            size="large"
            variant="contained"
            startIcon={<Iconify icon="eva:google-fill" />}
            onClick={() => login()}
            sx={{ borderColor: 'text.primary', width: '100%' }}
          >
            Login with Google
          </Button>
      </Stack>
    </div>
  );
}
