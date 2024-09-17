import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useMutation, useQueryClient } from '@tanstack/react-query';
// @mui
import { useTheme } from '@mui/material/styles';
import { Container, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { PATH_DASHBOARD } from '../../routes/paths';
// auth
import { useAuthContext } from '../../auth/useAuthContext';
// components
import { useSettingsContext } from '../../components/settings';
// sections
import { AppWelcome, AppWidgetSummary } from '../../sections/@dashboard/general/app';
// assets
import { SeoIllustration } from '../../assets/illustrations';
import axios from '../../utils/analyticAxios';

export default function GeneralAppPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const theme = useTheme();

  const { themeStretch } = useSettingsContext();

  const { mutate: handleStartAnalysisMutation, isPending: isPendingStartAnalysisMutation } = useMutation({
    mutationFn: () =>
      axios.post('analytic', {aId: '240912-001'}).then((res) => res.data),

    onMutate: async () => {
      const docs = queryClient.cancelQueries('load_data');
      queryClient.setQueryData('load_data', (old) => [...(old ?? []), {}]);
      return docs;
    },

    onError: (err, variables, recover) => (typeof recover === 'function' ? recover() : null),

    onSuccess: (data) => {
      queryClient.setQueryData('load_data', data);
      navigate(`${PATH_DASHBOARD.user.new}?id=${data.data._id}`);
    },
  });

  return (
    <>
      <Helmet>
        <title> General: App | Theoreka </title>
      </Helmet>

      <Container maxWidth={themeStretch ? false : 'xl'}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={12}>
            <AppWelcome
              title={`Welcome back! \n ${user?.name}`}
              description="Analyze your document and get the best insights"
              img={
                <SeoIllustration
                  sx={{
                    p: 3,
                    width: 360,
                    margin: { xs: 'auto', md: 'inherit' },
                  }}
                />
              }
              action={
                <LoadingButton
                  variant="contained"
                  onClick={() => handleStartAnalysisMutation()}
                  type="button"
                  loading={isPendingStartAnalysisMutation}
                      >
                  Start Analyzing
                </LoadingButton>
              }
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <AppWidgetSummary
              title="Your Total Documents"
              percent={2.6}
              total={65}
              chart={{
                colors: [theme.palette.primary.main],
                series: [5, 6, 8, 15, 16, 11, 9, 17, 10, 20],
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <AppWidgetSummary
              title="Total Insights"
              percent={0.2}
              total={100}
              chart={{
                colors: [theme.palette.info.main],
                series: [20, 41, 63, 33, 28, 35, 50, 46, 11, 26],
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <AppWidgetSummary
              title="Total Downloads"
              percent={-1.1}
              total={4}
              chart={{
                colors: [theme.palette.warning.main],
                series: [8, 9, 1, 8, 16, 9, 8, 3, 5, 4],
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
