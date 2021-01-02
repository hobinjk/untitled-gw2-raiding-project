import React from 'react';

export default function UserRegister() {
  return (
    <form action="/api/v0/user/register" method="post">
      <div className="field">
        <label className="label" htmlFor="username">Username</label>
        <div className="control">
          <input className="input" type="text" name="username" id="username" required />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="email">Email</label>
        <div className="control">
          <input className="input" type="text" name="email" id="email" required />
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
