import React, {useState} from 'react';
import API from '../API';

type IUserLoginState = {
  username: string,
  password: string,
};

export default function UserLogin() {
  let [appState, setAppState] = useState<IUserLoginState>({
    username: '',
    password: '',
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    (async () => {
      const successful = await API.login(appState.username, appState.password);
      if (!successful) {
        alert('real error todo');
        return;
      }
      window.location.reload();
    })();
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newState: any = Object.assign({}, appState);
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
        <label className="label" htmlFor="username">Username</label>
        <div className="control">
          <input className="input" type="text" onChange={onChange} name="username" id="username" required />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="password">Password</label>
        <div className="control">
          <input className="input" type="password" onChange={onChange} name="password" id="password" required />
        </div>
      </div>
      <div className="field">
        <input className="button" type="submit" value="Login" />
      </div>
    </form>
  );
}
