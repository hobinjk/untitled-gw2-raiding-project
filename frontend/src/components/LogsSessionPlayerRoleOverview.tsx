import React from 'react';
import './LogsSessionPlayerRoleOverview.css';
import roleToColor from '../roleToColor';

export default function LogsSessionPlayerRoleOverview(props: any) {
  const { roles } = props;
  if (!roles) {
    return (
      <></>
    );
  }

  return (
    <div className="logs-session-player-role-overview-graph-container"
         style={{
           width: (roles.length * 0.5) + 'rem',
         }}>
      {roles.map((role: string) => {
        let color = roleToColor(role);
        let title = role;
        return (
          <div className="logs-session-player-role-overview-graph-element"
               title={title}
               style={{
                 backgroundColor: color,
               }}></div>
        );
      })}
    </div>
  );
}
