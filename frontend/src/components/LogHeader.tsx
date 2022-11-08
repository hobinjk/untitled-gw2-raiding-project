import React from 'react';
import API from '../API';
import './LogHeader.css';

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
    <div className="log-header-container">
      <div className="log-header-title">
        <h1 className="title">{log.fightName}</h1>
        <p>
          Uploaded by {log.uploaderName}
          {log.deletable &&
            <input className="button" type="button" value="Delete" onClick={onDelete}/>
          }
        </p>
      </div>
      <div className="log-header-details">
        <p>
          {log.success ? 'Success' : 'Failure'} in {log.duration}
        </p>
        {log.meta.emboldened && (
          <p>
            Emboldened
          </p>
        )}
        <p>
          {log.timeStart}
        </p>
        <p>
          Tags: {log.meta.tags.join(', ')}
        </p>
        <p>
          {log.meta.dps_report_link &&
            <a href={log.meta.dps_report_link}>
              {log.meta.dps_report_link.replace(/^https?:\/\//, '')}
            </a>
          }
        </p>
      </div>
    </div>
  );
}

