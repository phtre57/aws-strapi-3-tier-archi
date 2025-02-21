module.exports = ({ env }) => {
  const isProdOrDev = env('NODE_ENV') === 'prod' || env('NODE_ENV') === 'dev';

  return {
    upload: {
      config: isProdOrDev
        ? {
            provider: 'aws-s3',
            providerOptions: {
              accessKeyId: env('AWS_ACCESS_KEY_ID'),
              secretAccessKey: env('AWS_ACCESS_SECRET'),
              region: env('AWS_REGION'),
              params: {
                Bucket: env('AWS_BUCKET'),
              },
            },
            actionOptions: {
              upload: {},
              uploadStream: {},
              delete: {},
            },
          }
        : {
            provider: 'local',
            providerOptions: {},
          },
    },
  };
};