import React, {useState} from 'react';
import API from '../API';

type IUploadViewState = {
  url: string,
  visibility: string,
};

export default function UploadView() {
  let [appState, setAppState] = useState<IUploadViewState>({
    url: '',
    visibility: 'public',
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    (async () => {
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
          alert(body.msg);
        }
        return;
      }
      if (res.url) {
        window.location.href = res.url;
      }
    })();
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
    let newState: any = Object.assign({}, appState);
    console.log('onChange', e.target);
    if (!e.target ||
        !newState.hasOwnProperty(e.target.name)) {
      return;
    }
    newState[e.target.name] = e.target.value;
    setAppState(newState);
  };

  return (
    <section className="section">
      <form onSubmit={onSubmit}>
        <div className="field">
          <label className="label" htmlFor="url">dps.report url</label>
          <div className="control">
            <input className="input" type="text" onChange={onChange} name="url"
                   id="url" required placeholder="https://dps.report/..." />
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="visibility">Visibility</label>
          <div className="control">
            <select className="input" onChange={onChange}
                    name="visibility" id="visibility">
              <option value="public" selected>Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div className="field">
          <input className="button" type="submit" value="Upload" />
        </div>
      </form>
    </section>
  );
}
