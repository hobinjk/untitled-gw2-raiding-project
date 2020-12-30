import React from 'react';

export default function UserRegister() {
  return (
    <form action="/api/v0/user" method="post">
      <div className="field">
        <label className="label" htmlFor="username">dps.report url</label>
        <div className="control">
          <input className="input" type="text" name="username" id="username" required />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="password">Password</label>
        <div className="control">
          <input className="input" type="password" name="password" id="password" required />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="confirmPassword">Confirm Password</label>
        <div className="control">
          <input className="input" type="password" name="confirmPassword" id="username" required />
        </div>
      </div>

      <div className="field">
        <input className="button" type="submit" value="Register" />
      </div>
    </form>
  );
}
