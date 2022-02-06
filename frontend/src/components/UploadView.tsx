import React, {useState} from 'react';
import UploadLogItem from './UploadLogItem';

type IUploadViewState = {
  urls: string,
  visibility: string,
  submissions: Array<string>,
};

export default function UploadView() {
  let [appState, setAppState] = useState<IUploadViewState>({
    urls: '',
    visibility: 'public',
    submissions: [],
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let urls = appState.urls.split('\n').filter(line => {
      return line.includes('dps.report');
    });

    setAppState({
      ...appState,
      urls: '',
      submissions: appState.submissions.concat(urls),
    });
  };

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement|HTMLSelectElement>) => {
    let newState: any = Object.assign({}, appState);
    if (!e.target ||
        !newState.hasOwnProperty(e.target.name)) {
      return;
    }
    const newValue = e.target.value || e.target.textContent;
    newState[e.target.name] = newValue;
    setAppState(newState);
  };

  return (
    <section className="section">
      {appState.submissions.map((submission) => {
        return <UploadLogItem url={submission} visibility={appState.visibility}/>
      })}
      <form onSubmit={onSubmit}>
        <div className="field">
          <label className="label" htmlFor="urls">dps.report urls</label>
          <div className="control">
            <textarea className="textarea" placeholder="https://dps.report/..."
                      rows={3} onChange={onChange} name="urls" id="urls" value={appState.urls}>
            </textarea>
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
