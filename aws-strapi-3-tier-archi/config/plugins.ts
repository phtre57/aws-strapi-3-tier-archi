module.exports = ({ env }) => {
  const isProdOrDev = env('NODE_ENV') === 'prod' || env('NODE_ENV') === 'dev';

  return {
    upload: {
      config: isProdOrDev
        ? {
            provider: 'aws-s3',
            providerOptions: {
              s3Options: {
                region: env('AWS_REGION'),
                params: {
                  ACL: 'private',
                  signedUrlExpires: env('AWS_SIGNED_URL_EXPIRES', 15 * 60),
                  Bucket: env('AWS_BUCKET'),
                },
              }
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