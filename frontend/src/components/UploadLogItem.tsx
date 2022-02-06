import React, {useEffect, useState} from 'react';
import API from '../API';

type IUploadLogItemState = {
  url: string,
  visibility: string,
  success: string|null,
  error: string|null,
};

type IUploadLogItemParams = {
  url: string,
  visibility: string,
};

export default function UploadLogItem(params: IUploadLogItemParams) {
  let {url, visibility} = params;
  let [appState, setAppState] = useState<IUploadLogItemState>({
    url,
    visibility,
    success: null,
    error: null,
  });

  const attemptUpload = async () => {
    setAppState({
      ...appState,
      success: null,
      error: null,
    });
    const res = await API.fetch('/api/v0/logs', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(appState),
    });
    if (!res.ok) {
      let body;
      try {
        body = await res.json();
      } catch (e) {
        console.warn(e);
      }
      console.warn(body);
      if (body.msg) {
        setAppState({
          ...appState,
          error: body.msg,
        });
      } else {
        setAppState({
          ...appState,
          error: 'unknown error',
        });
      }
      return;
    }
    if (res.url) {
      setAppState({
        ...appState,
        success: res.url,
      });
    }
  };

  useEffect(() => {
    attemptUpload();
  }, []);

  return (
    <div className="my-4">
      <span className="mr-2">{appState.url}</span>

      {appState.success &&
        <a href={appState.success}>More</a>}
      {appState.error && (<>
        <span className="error m-2">{appState.error}</span>
        <input type="button" className="button" onClick={attemptUpload} value="Retry"/>
      </>)}
      {(!appState.success && !appState.error) &&
          <span>Uploading</span>}
    </div>
  );
}

