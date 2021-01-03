import React from 'react';

export default function LogHeader(props: any) {
  const { loading, log } = props;
  if (loading) {
    return (
      <p>Loading</p>
    );
  }

  if (!log) {
    return (
      <p>No log found</p>
    );
  }

  return (
    <div>
      <h1 className="title">{log.fightName}</h1>
      <p>
        Uploaded by {log.uploaderName}
      </p>
      <p>
        {log.success ? 'Success' : 'Failure'}
      </p>
      <p>
        {log.timeStart} &ndash; {log.duration}
      </p>
    </div>
  );
}

