/* eslint-disable no-nested-ternary */
// import PropTypes from 'prop-types';
// import * as Yup from 'yup';
import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
// react query
// eslint-disable-next-line import/no-extraneous-dependencies
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
// @mui
import { LoadingButton } from '@mui/lab';
import { Card, Grid, Stack, Typography, CardContent, CardHeader } from '@mui/material';
// routes
// import { PATH_DASHBOARD } from '../../../routes/paths';
// utils
import { useSnackbar } from '../../../components/snackbar';
import axios from '../../../utils/analyticAxios';
// components
import { Upload } from '../../../components/upload';

// ----------------------------------------------------------------------

// UserNewEditForm.propTypes = {
//   userData: PropTypes.object,
// };

export default function UserNewEditForm() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const queryClient = useQueryClient();

  const [files, setFiles] = useState([]);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isCleaned, setIsCleaned] = useState(false);
  const [isDrawn, setIsDrawn] = useState(false);

  const [cleanedData, setCleanedData] = useState({});
  const [graphData, setGraphData] = useState({});

  const { enqueueSnackbar } = useSnackbar();

  const handleDropMultiFile = useCallback(
    (acceptedFiles) => {
      setFiles([
        ...files,
        ...acceptedFiles.map((newFile) =>
          Object.assign(newFile, {
            preview: URL.createObjectURL(newFile),
          })
        ),
      ]);
    },
    [files]
  );

  const handleRemoveFile = (inputFile) => {
    const filesFiltered = files.filter((fileFiltered) => fileFiltered !== inputFile);
    setFiles(filesFiltered);
    setIsUploaded(false);
  };

  // ===================================================================================================

  const { mutate: handleFileUploadMutation, isPending: isPendingFileUploadMutation } = useMutation({
    mutationFn: (payload) =>
      axios
        .post(`analytic/upload_file/${id}`, payload, {
          onUploadProgress: (progressEvent) => {
            const percentageCompleted =
              Math.round(progressEvent.loaded * 100) / progressEvent.total;
            console.log('percent', percentageCompleted);
          },
        })
        .then((res) => res.data),

    onMutate: async (payload) => {
      const docs = queryClient.cancelQueries('upload_file');
      queryClient.setQueryData('upload_file', (old) => [
        ...(old ?? []),
        {
          title: payload.title,
          author: payload.author,
          description: payload.description,
          files,
        },
      ]);
      return docs;
    },

    onError: (err, variables, recover) => (typeof recover === 'function' ? recover() : null),

    onSuccess: (data) => {
      console.log('data', data);
      enqueueSnackbar(data.description, {variant: data.response_type});
      if(data.status_code === 200){
        setIsUploaded(true);
        handleFileCleanMutation();
      }
    },
  });

  const handleFileUpload = (event) => {
    event.preventDefault();

    // eslint-disable-next-line prefer-const
    let formData = new FormData();
    formData.append('file', files[0]);

    handleFileUploadMutation(formData);
  };

  // ===================================================================================================

  const { mutate: handleFileCleanMutation, isPending: isPendingFileCleanMutation } = useMutation({
    mutationFn: () => axios.post(`analytic/clean_file/${id}`).then((res) => res.data),

    onMutate: async () => {
      const docs = queryClient.cancelQueries('clean_file');
      queryClient.setQueryData('clean_file', (old) => [...(old ?? []), {}]);
      return docs;
    },

    onError: (err, variables, recover) => (typeof recover === 'function' ? recover() : null),

    onSuccess: (data) => {
      console.log('clean_file', data);
      enqueueSnackbar(data.description, {variant: data.response_type});
      if(data.status_code === 200){
        setIsCleaned(true);
        setCleanedData(data);
        handleFileCleanMutation();
        handleInsightDrawMutation();
      }
    },
  });

  const handleFileClean = () => {
    setIsCleaned(false);
    handleFileCleanMutation()
  }

  // ===================================================================================================
  const { mutate: handleInsightDrawMutation, isPending: isPendingInsightDrawMutation } =
    useMutation({
      mutationFn: () => axios.post(`analytic/draw_insights/${id}`).then((res) => res.data),

      onMutate: async () => {
        const docs = queryClient.cancelQueries('draw_insights');
        queryClient.setQueryData('draw_insights', (old) => [...(old ?? []), {}]);
        return docs;
      },

      onError: (err, variables, recover) => (typeof recover === 'function' ? recover() : null),

      onSuccess: (data) => {
        console.log('data', data);
        enqueueSnackbar(data.description, {variant: data.response_type});
        if(data.status_code === 200){
          setIsDrawn(true);
          setGraphData(data);
          handleFileCleanMutation();
          handleInsightDrawMutation();
        }
      },
    });
  
    const handleInsightDraw = () => {
      setIsDrawn(false)
      handleInsightDrawMutation()
    }

  // ===================================================================================================

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={12}>
        <Card sx={{ p: 3 }}>
          {/* <Typography variant="h4" gutterBottom>
              Step 1
            </Typography> */}
          <Stack spacing={2} alignItems="center" sx={{ mt: 3 }}>
            {/* <RHFTextField name="name" label="Name of child" /> */}
            <Card sx={{ width: '100%' }}>
              <CardHeader title="1. Upload Your Data File" />
              <CardContent>
                <Upload
                  isUploading={isPendingFileUploadMutation}
                  disabled={isUploaded}
                  multiple
                  thumbnail={false}
                  files={files}
                  onDrop={handleDropMultiFile}
                  onRemove={handleRemoveFile}
                  onUpload={(e) => handleFileUpload(e)}
                />
              </CardContent>
            </Card>
            {isUploaded && (
              <Card sx={{ width: '100%' }}>
                <CardHeader
                  title="2. Load and Clean Data from your file"
                  action={
                    <LoadingButton
                      type="button"
                      variant="outlined"
                      sx={{ width: '100%' }}
                      onClick={() => handleFileClean()}
                      loading={isPendingFileCleanMutation}
                    >
                      Retry
                    </LoadingButton>
                  }
                />
                <CardContent>
                  {isPendingFileCleanMutation ? (
                    'loading'
                  ) : isCleaned ? (
                    <Stack>
                      {cleanedData?.data?.map((data) => (
                        <ReactMarkdown language="markdown">{`${data}`}</ReactMarkdown>
                      ))}
                      <Typography variant="body2">{cleanedData?.description}</Typography>
                    </Stack>
                  ) : (
                    'No data to display'
                  )}
                </CardContent>
              </Card>
            )}
            {isCleaned && (
              <Card sx={{ width: '100%' }}>
                <CardHeader
                  title="3. Draw Graph"
                  action={
                    <LoadingButton
                      type="button"
                      variant="outlined"
                      sx={{ width: '100%' }}
                      onClick={() => handleInsightDraw()}
                      loading={isPendingInsightDrawMutation}
                    >
                      Draw
                    </LoadingButton>
                  }
                />
                <CardContent>
                  {isPendingInsightDrawMutation ? (
                    'loading'
                  ) : isDrawn ? (
                    <Stack>
                      {graphData?.data?.message?.map((data) => (
                        <ReactMarkdown language="markdown">{`${data}`}</ReactMarkdown>
                      ))}
                      {graphData?.data?.insights?.map((data) => (
                        <img
                          src={`https://theorekabucket.s3.eu-north-1.amazonaws.com/${data}`}
                          alt="graph"
                        />
                      ))}
                      <Typography variant="body2">{graphData?.data?.description}</Typography>
                    </Stack>
                  ) : (
                    'No graph to display'
                  )}
                </CardContent>
              </Card>
            )}
            {/* <Stack
                alignItems="center"
                sx={{ mt: 3, width: 1, gap: 2 }}
                direction={{ xs: 'column', sm: 'row' }}
              >
                <LoadingButton
                  type="button"
                  variant="outlined"
                  onClick={reset}
                  sx={{ width: '100%' }}
                >
                  Clear
                </LoadingButton>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={isSubmitting}
                  sx={{ width: '100%' }}
                >
                  Upload
                </LoadingButton>
              </Stack> */}
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}
