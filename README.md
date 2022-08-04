# LMSAdapter
An auto switching SCORM and AICC plugin for sending student data back to a SCORM 1.2 or AICC compatible learning management solution.

The code is written in Typescript and could be included in a JavaScript, Angular, React or Vue JS application.

As an example, in a Vue JS application, the code could be added to the src/models folder and then an LMS Adapter object created:

```Typescript
const LMSAdapter = LMSAdapterFactory.createAdapter(window.location.search);

const studentName =  LMSAdapter.studentName;
```

If you pass in the browser’s query string (as shown above), the LMSAdapterFactory will figure out if you need a SCORM LMS adapter or an AICC LMS adapter and return the appropriate object for you.

Once you have the adapter object, e.g. LMSAdapter in the example above, you can call methods such as LMSAdapter.studentname, LMSAdapter.lessonStatus, LMSAdapter.commitValues()) and LMSAdapter.finishSession().  Whether the session is sitting inside an LMS using SCORM 1.2 or AICC, you shouldn’t need to call different methods from your Vue JS code, the adapter should take care of those details for you. 

Currently interactions and objectives are supported by the SCORM 1.2 adapter only.
