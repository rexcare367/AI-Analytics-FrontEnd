/* eslint-disable no-nested-ternary */
// import PropTypes from 'prop-types';
// import * as Yup from 'yup';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
// react query
// eslint-disable-next-line import/no-extraneous-dependencies
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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

const Skeleton = () => <div className="flex items-center justify-center h-fit w-full">
<div className="animate-pulse flex flex-col space-y-4 w-full">
  <div className="flex flex-col space-y-2 w-full">
    <div className="h-4 w-full bg-gray-300 rounded"/>
  </div>
  <div className="flex flex-row gap-4 w-full">
    <div className="h-4 w-full bg-gray-300 rounded"/>
    <div className="h-4 w-full bg-gray-300 rounded"/>
  </div>
  <div className="flex flex-col space-y-2 w-full">
    <div className="h-4 w-full bg-gray-300 rounded"/>
  </div>
</div>
</div>

export default function UserNewEditForm() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const drawButtonRef = useRef(null);

  const queryClient = useQueryClient();

  const [files, setFiles] = useState([]);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isCleaned, setIsCleaned] = useState(false);
  const [isDrawn, setIsDrawn] = useState(false);

  const [ischecking, setIsChecking] = useState(false);
  const [isCheckedStatus, setIsCheckedStatus] = useState(false);

  const [isFinished, setIsFinished] = useState(false);

  const [currentStep, setCurrentStep] = useState('');

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
        handleFileClean();
      }
    },
  });

  const handleFileUpload = (event) => {
    event.preventDefault();

    // eslint-disable-next-line prefer-const
    let formData = new FormData();
    formData.append('file', files[0]);

    setCurrentStep("upload")
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
      setIsCleaned(true);
      setIsChecking(true);
      refetchStateData();
    },
    
  });

  const handleFileClean = () => {
    setCurrentStep("cleaned")
    setIsCleaned(false);
    setIsDrawn(false)
    handleFileCleanMutation()
  }

  // ===================================================================================================
  const { mutate: handleInsightDrawMutation, isPending: isPendingInsightDrawMutation } = useMutation({
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
        setIsDrawn(true);
        setIsChecking(true);
        refetchStateData();
      },
  });

  const handleInsightDraw = useCallback(() => {
    setCurrentStep("insights ready")
    setIsDrawn(false)
    handleInsightDrawMutation()
    }, [handleInsightDrawMutation])

  const { data: stateData, isSuccess: isSuccessStateData, isLoading: isLoadingStateData, isFetching: isFetchingStateData, refetch: refetchStateData } = useQuery({
    queryKey: ['state_data'],
    queryFn: () => axios.get(`analytic/check_status/${id}`).then((res) => {
      console.log('res', res.data, res.data.data.current, currentStep); 
      if(res.data.data.current === currentStep){
        setIsCheckedStatus(false); 
      }
      else {
        setIsChecking(false);
        setIsCheckedStatus(true);
      }
      return res.data; 
    }),
    enabled: (isDrawn || isCleaned) && isCheckedStatus,
    refetchInterval: 5000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchIntervalInBackground: true,
    
  });
  useEffect(() => {
    if (currentStep === "cleaned" && isSuccessStateData && stateData?.data?.cleaned?.status === "completed" && stateData?.data?.cleaned?.attachments) {
      handleInsightDraw()
    }
  }, [isSuccessStateData,stateData, handleInsightDraw, currentStep]);


  // ===================================================================================================

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={12}>
        <Card sx={{ p: 3 }}>
          {isCleaned ? 'isCleaned' : 'not isCleaned'}
          {currentStep}
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
                      loading={ currentStep === "cleaned" && (isPendingFileCleanMutation || isLoadingStateData || isFetchingStateData || ischecking)}
                    >
                      Retry
                    </LoadingButton>
                  }
                />
                <CardContent>
                  {currentStep === "cleaned" && (isPendingFileCleanMutation || isLoadingStateData || isFetchingStateData || ischecking) ? (
                    <Skeleton />
                  ) : isCleaned ? (
                    <Stack sx={{fontSize: 12}}>
                      {stateData?.data?.cleaned?.message?.map((data) => (
                        <ReactMarkdown language="markdown">{`${data}`}</ReactMarkdown>
                      ))}
                      <Typography variant="body2">{stateData?.data?.cleaned?.attachments}</Typography>
                    </Stack>
                  ) : (
                    'No data to display'
                  )}
                </CardContent>
              </Card>
            )}
            {isCleaned && stateData?.data?.cleaned?.attachments && (
              <Card sx={{ width: '100%' }}>
                <CardHeader
                  title="3. Draw Graph"
                  action={
                    <LoadingButton
                      ref={drawButtonRef}
                      type="button"
                      variant="outlined"
                      sx={{ width: '100%' }}
                      onClick={() => handleInsightDraw()}
                      loading={currentStep === "insights ready" && (isPendingInsightDrawMutation || isLoadingStateData || isFetchingStateData || ischecking)}
                    >
                      Draw
                    </LoadingButton>
                  }
                />
                <CardContent>
                  {currentStep === "insights ready" && (isPendingInsightDrawMutation || isLoadingStateData || isFetchingStateData || ischecking) ? (
                    <Skeleton />
                  ) : isDrawn ? (
                    <Stack sx={{fontSize: 12}}>
                      {stateData?.data?.message?.map((data) => (
                        <ReactMarkdown language="markdown">{`${data}`}</ReactMarkdown>
                      ))}
                      {stateData?.data?.insights?.map((data) => (
                        <img
                          key={data}
                          src={`https://theorekabucket.s3.eu-north-1.amazonaws.com/${data}`}
                          alt="graph"
                        />
                      ))}
                      <Typography variant="body2">{stateData?.data?.description}</Typography>
                    </Stack>
                  ) : (
                    'No graph to display'
                  )}
                </CardContent>
              </Card>
            )}
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}
