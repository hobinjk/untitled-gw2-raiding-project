import React, {useState} from 'react';
import API from '../API';

type IUserKeyAddState = {
  key: string,
}

export default function UserKeyAdd(props: any) {
  const [appState, setAppState] = useState<IUserKeyAddState>({
    key: '',
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    (async () => {
      const res = await API.fetch('/api/v0/user/keys', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(appState),
      });
      console.log(res);
      if (!res.ok) {
        alert('real error todo');
        return;
      }
      window.location.reload(); // :\ could be better
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
    <form onSubmit={onSubmit}>
      <div className="field">
        <label className="label" htmlFor="key">Account GW2 API Key</label>
        <div className="control">
          <input className="input" type="text" onChange={onChange} name="key"
                 id="key" required />
        </div>
      </div>
      <div className="field">
        <input className="button" type="submit" value="Add" />
      </div>
    </form>
  );
}
