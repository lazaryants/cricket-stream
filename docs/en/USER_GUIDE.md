# Cricket Stream Platform User Guide

[Русская версия](../ru/USER_GUIDE.md)

Production URL: [https://de.cricket-stream.icu](https://de.cricket-stream.icu)

This guide explains the day-to-day use of Cricket Stream Platform for viewers, operators, and administrators.

## 1. Sign In

Open the production URL over HTTPS and enter your username or email address and password.

The language switcher is available in the upper-right corner of the sign-in page. English is the default interface language. The selected language is preserved for future sessions.

After successful authentication, the Dashboard opens.

Security recommendations:

- do not save an administrator password on a shared computer;
- always use the HTTPS address;
- sign out after completing operational work;
- change temporary passwords immediately.

## 2. User Roles

### Viewer

A Viewer can:

- see permitted streams;
- view statuses, diagnostics, metrics, sessions, and preview;
- open Dashboard, Monitor, All Streams, details, and account pages.

A Viewer cannot:

- receive source URLs from the API;
- receive RTMP destination URLs from the API;
- start or stop streams;
- create, edit, or delete streams;
- change libraries or system settings.

### Operator

An Operator can:

- view source and RTMP destination URLs;
- start and stop streams;
- create streams when permitted by the current backend policy;
- edit names, descriptions, source URLs, providers, and source engines;
- use saved sources and destinations;
- inspect metrics, diagnostics, sessions, and logs.

An Operator cannot modify RTMP destination definitions.

### Administrator

An Administrator has all Operator capabilities and can additionally:

- create and delete stream records;
- manage source and RTMP destination libraries;
- change RTMP destinations;
- manage user passwords;
- access the Components page;
- perform administrative configuration tasks.

## 3. Interface Language

The interface supports:

- English;
- Russian.

Use the language switcher in the upper-right area of the page. The setting changes immediately without reloading the application.

The selected language affects:

- navigation;
- forms;
- statuses;
- diagnostics;
- error messages;
- dates;
- uptime formatting;
- component update information.

## 4. Dashboard

The Dashboard is the main operational overview.

Only streams with **Show on Dashboard** enabled are displayed.

Each card may contain:

- stream name and description;
- provider;
- current process status;
- diagnostic status;
- preview image or live preview;
- resolution;
- source FPS;
- output bitrate;
- FFmpeg processing speed;
- video and audio codecs;
- uptime;
- dropped frames;
- start and stop controls for authorized users.

Clicking the free area of a card opens the Stream Details page. Buttons and switches inside the card perform their own actions and do not open the details page.

### Dashboard visibility

Dashboard visibility is independent of whether a stream is running.

A stopped stream can remain visible on Dashboard, and a running stream can be hidden.

## 5. All Streams

The **All Streams** page contains the complete stream inventory, including:

- running streams;
- stopped streams;
- streams hidden from Dashboard;
- disabled streams;
- streams with source or runtime problems.

Available tools include:

- text search;
- status filters;
- Dashboard visibility filter;
- disabled-stream filter;
- global refresh;
- desktop table;
- mobile cards.

The desktop table displays:

- Dashboard visibility;
- stream name;
- process status;
- diagnostics;
- live metrics;
- provider;
- node;
- enabled state;
- actions.

### Diagnostics

Diagnostics describe the current or most recent operational condition.

Examples include:

- stream is running;
- source is unavailable;
- source is offline;
- destination refused the connection;
- authentication failed;
- network unavailable;
- connection timed out;
- connection lost;
- source process failed;
- FFmpeg failed;
- stream stopped;
- no runtime data.

Hover over or focus the diagnostic chip to read the detailed explanation.

An offline source is not necessarily a platform failure. It often means the external channel has not started broadcasting yet.

## 6. Create a Stream

Stream creation is normally performed by an Administrator.

1. Open **All Streams**.
2. Select **New Stream**.
3. Enter a clear name.
4. Add an optional description.
5. Choose a saved source or select manual input.
6. Verify the provider.
7. Choose the source engine.
8. Choose a saved RTMP destination or enter one manually.
9. Verify the node.
10. Configure enabled state, desired active state, and Dashboard visibility.
11. Save the stream.

Before saving, verify the RTMP destination carefully. An incorrect destination can publish the signal to the wrong venue or channel.

## 7. Edit a Stream

Open the stream details page and select **Edit**, or use the edit action in **All Streams**.

Before changing source, engine, or destination settings:

1. stop the stream;
2. wait until the process status becomes stopped;
3. apply the changes;
4. save;
5. start the stream again;
6. verify RTMP reception and preview.

Editing a running stream can produce confusing runtime behavior and should be avoided.

## 8. Source Selection

A source can be selected from the library or entered manually.

Supported source categories include:

- YouTube;
- Twitch;
- Kick;
- Vimeo;
- direct media or stream URL.

The provider helps the backend select the correct source handling logic.

### Saved source

Select a reusable source record from the library.

### Manual source

Enter the URL directly into the stream form.

Changing a library record does not automatically rewrite existing stream records.

## 9. Source Engine

### Auto

Recommended for normal operation.

The backend selects the appropriate resolution path and can use Streamlink or yt-dlp according to the implemented provider logic.

### Streamlink

Use Streamlink when the source is known to work reliably through Streamlink.

Typical process:

```text
Streamlink -> stdout pipe -> FFmpeg
```

### yt-dlp

Use yt-dlp when Streamlink cannot resolve the source or when the platform page format is better supported by yt-dlp.

Typical process:

```text
yt-dlp -> direct media URL -> FFmpeg
```

Engine changes take effect on the next start. Stop a running stream before changing the engine.

## 10. RTMP Destination

A destination can be selected from the library or entered manually.

The URL must normally begin with:

```text
rtmp://
```

or:

```text
rtmps://
```

The current receiving domain is:

```text
rtmp.cricket-stream.icu
```

Venue paths such as `place1`, `place2`, and their stream keys remain separate destination definitions.

Only an Administrator should change destination records.

## 11. Start a Stream

Before starting, verify:

- the source is currently live;
- the source URL is correct;
- the provider is correct;
- the source engine is appropriate;
- the RTMP destination is correct;
- the stream record is enabled;
- the selected node is available.

After selecting **Start**, the status may move through several states before becoming **Running**.

The HLS preview can take several seconds to appear because FFmpeg must create the first playlist and segments.

Do not repeatedly press Start while the stream is already starting.

## 12. Stop a Stream

Select **Stop** from Dashboard, All Streams, or Stream Details.

Stop remains available while the supervisor is attempting to recover a failed source. This allows the operator to cancel repeated recovery attempts.

Wait until the status is fully stopped before editing source or destination settings.

Use the web interface for planned stops instead of terminating FFmpeg manually.

## 13. Desired Active State

The desired active setting records whether the platform should attempt to keep the stream active.

When enabled, the backend can restore the stream after a backend restart.

Disable desired active state when a stream should remain stopped.

This setting is different from Dashboard visibility.

## 14. Stream Details

The Stream Details page provides the most complete information about one stream.

It includes:

- Back navigation;
- stream name and description;
- edit action;
- protected live HLS player;
- fullscreen playback;
- start and stop controls;
- process status and PID;
- source and destination route;
- live video and audio metrics;
- diagnostics;
- recent sessions;
- latest session log.

The player retries while the first HLS playlist is being created. A manual page refresh is normally unnecessary.

## 15. Live Preview

Preview is generated by the same FFmpeg process that publishes RTMP.

The standard configuration uses stream copy:

```text
-c:v copy
-c:a copy
```

This means the preview does not add a separate transcoding workload.

Preview access is protected by the authenticated API and short-lived playback tokens. The HLS directory must not be exposed publicly through Nginx.

Possible preview states:

- connecting;
- playlist not ready;
- source unavailable;
- browser does not support HLS;
- live playback available.

## 16. Monitor

The Monitor page is intended for continuous visual control during an event.

Available layouts:

- 1 stream;
- 4 streams;
- 9 streams;
- 16 streams.

The selected grid determines tile size even when fewer streams are currently visible. This keeps the layout stable.

Monitor tiles can show:

- live video;
- stream name;
- resolution;
- bitrate;
- FPS;
- problem indication.

Use the page-level fullscreen action for a monitoring wall. The individual player fullscreen control is separate.

Clicking a tile opens Stream Details.

## 17. Libraries

### Source Library

Use the source library for recurring channels and links.

Each record contains:

- name;
- provider;
- source URL;
- optional description;
- enabled state.

Disabled records are not offered for new selections unless disabled items are explicitly shown.

### RTMP Destination Library

Use the destination library for approved publication endpoints.

Each record contains:

- name;
- RTMP URL;
- optional description;
- enabled state.

Use clear names such as venue or court identifiers.

### Important library behavior

Editing or deleting a library item does not automatically alter stream cards already created from that item.

This prevents an accidental global change to production streams.

## 18. Users

The Users page is available to Administrators.

The current version displays:

- username;
- email;
- role;
- active or disabled state;
- last login;
- password-reset action.

An Administrator can reset another user's password. Existing sessions for that user are invalidated.

The current interface does not yet provide full user creation, role editing, or deletion from the browser unless those functions are added in a later release.

## 19. Account and Password

### Change your own password

1. Open **Account**.
2. Enter the current password.
3. Enter a new password of at least eight characters.
4. Repeat the new password.
5. Select **Change Password**.
6. Sign in again.

Changing the password invalidates previously issued sessions.

### Reset another user's password

1. Open **Users**.
2. Find the user.
3. Select **Change Password**.
4. Enter the temporary password twice.
5. Deliver it through a secure channel.
6. Ask the user to change it immediately.

The Administrator cannot view the previous password.

## 20. Components

The Components page reports installed versions and, where supported, available versions.

Typical components include:

- Python;
- FFmpeg;
- Streamlink;
- yt-dlp.

Select **Check Updates** to perform a fresh check.

Statuses include:

- up to date;
- update available;
- checked;
- check failed;
- unknown.

An available update should not be installed during an active event. Upgrade components during a maintenance window and test real sources afterward.

## 21. Recommended Pre-Event Checklist

1. Sign in over HTTPS.
2. Confirm the correct interface language.
3. Open Components and review version status.
4. Verify source-library records.
5. Verify RTMP destination records.
6. Check that every stream points to the correct venue.
7. Confirm Dashboard visibility.
8. Start one known live test source.
9. Verify RTMP reception on the destination server.
10. Verify HLS preview.
11. Check resolution, FPS, bitrate, and dropped frames.
12. Stop the test.
13. Prepare production stream cards.
14. Open Monitor using the required layout.

## 22. During an Event

- keep Monitor open;
- watch diagnostics and bitrate;
- investigate repeated restarts;
- confirm destination reception independently;
- avoid editing running streams;
- use Stop to cancel recovery attempts;
- open Stream Details and session logs when a problem occurs.

## 23. Post-Event Checklist

1. Stop streams that should not remain active.
2. Disable desired active state where appropriate.
3. Confirm the final stopped status.
4. Review failed sessions if any.
5. Sign out.
6. Do not shut down the backend or server while streams are still active unless required by an emergency.

## 24. Troubleshooting

### Source is not live

Confirm that the external channel has started broadcasting.

Check:

- source URL;
- provider;
- engine;
- geographic or authentication restrictions.

Try the alternative source engine if appropriate.

### Source unavailable

Open the diagnostic tooltip and latest session log.

The source page may have changed, the service may be blocked, or the source may have ended.

### RTMP destination rejects the stream

Verify:

- hostname;
- application path;
- stream key;
- authentication requirements;
- destination server availability.

Stop the stream before editing the destination.

### Process exists but preview is missing

Wait for the first HLS segments.

Then inspect:

- diagnostics;
- FFmpeg log;
- HLS readiness state;
- browser console only when necessary.

### Preview works but destination does not receive video

Check the RTMP destination independently. Preview proves that FFmpeg receives and processes the source, but does not prove that the external RTMP server accepts the output.

### Metrics are missing

Metrics appear only after FFmpeg has produced progress information.

A newly started stream can briefly show no data.

### Site is unavailable

A server Administrator should check:

```bash
sudo systemctl status cricket-backend --no-pager -l
sudo systemctl status nginx --no-pager -l
sudo systemctl status postgresql --no-pager -l
```

Then review the Operations Guide.

## 25. Safe Operating Practices

- preserve the production database;
- do not replace production `.env`;
- do not overwrite Certbot-managed Nginx configuration blindly;
- do not expose HLS files publicly;
- stop streams before changing route settings;
- verify RTMP destinations before every event;
- update Streamlink, yt-dlp, or FFmpeg only during maintenance;
- keep Administrator credentials private;
- use role-appropriate accounts for routine work.
