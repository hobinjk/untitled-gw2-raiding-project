import React from 'react';
import API from '../API';

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

  async function onDelete() {
    const res = await API.fetch(`/api/v0/logs/${log.id}`, {
      method: 'DELETE'
    });
    let data = await res.json();
    if (!data.success) {
      console.warn('error detected', data);
      return;
    }
    window.location.href = '/';
  }

  return (
    <div>
      <h1 className="title">{log.fightName}</h1>
      <p>
        Uploaded by {log.uploaderName}
        {log.deletable &&
          <input className="button" type="button" value="Delete" onClick={onDelete}/>
        }
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

