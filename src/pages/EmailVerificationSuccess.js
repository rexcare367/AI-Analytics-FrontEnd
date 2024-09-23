import { m } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import React, { useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
// @mui
import { Button, Typography } from '@mui/material';
// components
import { MotionContainer, varBounce } from '../components/animate';
// assets
import { SeverErrorIllustration } from '../assets/illustrations';
// import axios from '../utils/axios';

// ----------------------------------------------------------------------

export default function EmailVerificationSuccess() {
  const navigate = useNavigate()

  useEffect(() => {
    setTimeout(() => {
      navigate('/auth/login')
    }, 3000)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Helmet>
        <title> Email Verification | Theoreka</title>
      </Helmet>

      <MotionContainer>
        <m.div variants={varBounce().in}>
          <Typography variant="h3" paragraph>
            Email Verified
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <Typography sx={{ color: 'text.secondary' }}>
            Your Email is verified. From now you can login and analyze your douments.
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <SeverErrorIllustration sx={{ height: 260, my: { xs: 5, sm: 10 } }} />
        </m.div>

        <Button
          component={RouterLink}
          to="/auth/login"
          size="large"
          variant="contained"
        >
          back to Login
        </Button>
      </MotionContainer>
    </>
  );
}
