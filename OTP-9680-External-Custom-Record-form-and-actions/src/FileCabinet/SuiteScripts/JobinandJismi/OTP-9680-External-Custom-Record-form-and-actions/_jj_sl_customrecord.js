/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

/************************************************************************************************ 
 *  
 * OTP-9680 : Custom form to capture customer data and link to existing customer records
 * 
************************************************************************************************* 
 * 
 * Author: Jobin and Jismi IT Services 
 * 
 * Date Created : 24-October-2025 
 * 
 * Description : This Suitelet creates a custom form to capture customer data including name, email, subject, and message.
 * 
 * REVISION HISTORY
 *
 * @version 1.0 : 24-October-2025 :  The initial build was created by JJ0414
 * 
*************************************************************************************************/


define(['N/ui/serverWidget', 'N/record', 'N/log', 'N/search'],


  function (serverWidget, record, log, search) {

    /**
    * 
    * @param {Object} scriptContext
    * @param {ServerRequest} scriptContext.request - Incoming request
    * @param {ServerResponse} scriptContext.response - Suitelet response
    * @since 2015.2
    * 
    * creates a custom form to capture customer data including name, email, subject, and message.
    */


    function buildForm(errorMessage, params) {
      try {
        let form = serverWidget.createForm({ title: 'Customer Data' });

        form.addField({
          id: 'custpage_name',
          type: serverWidget.FieldType.TEXT,
          label: 'Customer Name'
        }).isMandatory = true;

        form.addField({
          id: 'custpage_email',
          type: serverWidget.FieldType.EMAIL,
          label: 'Customer Email'
        }).isMandatory = true;

        form.addField({
          id: 'custpage_subject',
          type: serverWidget.FieldType.TEXT,
          label: 'Subject'
        }).isMandatory = true;

        form.addField({
          id: 'custpage_message',
          type: serverWidget.FieldType.TEXT,
          label: 'Message'
        }).isMandatory = true;

        if (params) {
          form.getField('custpage_name').defaultValue = params.name || '';
          form.getField('custpage_email').defaultValue = params.email || '';
          form.getField('custpage_subject').defaultValue = params.subject || '';
          form.getField('custpage_message').defaultValue = params.message || '';
        }

        if (errorMessage) {
          form.addField({
            id: 'custpage_error',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Error'
          }).defaultValue = `<p style="color:red;">${errorMessage}</p>`;
        }

        form.addSubmitButton({ label: 'Submit' });
        return form;
      }
      catch (error) {
        log.error({ title: 'Form Build Error', details: error });
        throw error;
      }
    }

    /**
    * @param {Object} scriptContext
    * @param {ServerRequest} scriptContext.request - Incoming request
    * @param {ServerResponse} scriptContext.response - Suitelet response
    * @since 2015.2

    * check for existing email to prevent duplicate entries using search.
    */


    function emailExists(email) {
      try {
        let results = search.create({
          type: 'customrecord_jj_customer_data',
          filters: [['custrecord_jj_customeremail', 'is', email]],
          columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });

        return results.length > 0;
      }
      catch (error) {
        log.error({ title: 'Email Search Error', details: error });
        return false;
      }
    }

    /**
    * @param {Object} scriptContext
    * @param {ServerRequest} scriptContext.request - Incoming request
    * @param {ServerResponse} scriptContext.response - Suitelet response
    * @since 2015.2
    * Creates a custom record to store the captured customer data.
    */



    function createEnquiryRecord(params) {
      try {
        let enquiry = record.create({
          type: 'customrecord_jj_customer_data',
          isDynamic: true
        });

        enquiry.setValue({ fieldId: 'custrecord_jj_customername', value: params.name });
        enquiry.setValue({ fieldId: 'custrecord_jj_customeremail', value: params.email });
        enquiry.setValue({ fieldId: 'custrecord_jj_subject', value: params.subject });
        enquiry.setValue({ fieldId: 'custrecord_jj_message', value: params.message });

        enquiry.save();
      }
      catch (error) {
        log.error({ title: 'Record Creation Error', details: error });
        throw error;
      }
    }

    /**
    * Defines the Suitelet script trigger point.
    * @param {Object} scriptContext
    * @param {ServerRequest} scriptContext.request - Incoming request
    * @param {ServerResponse} scriptContext.response - Suitelet response
    * @since 2015.2
    * Handles GET and POST requests for the Suitelet and processes form submissions and prevents duplicates.
    */



    function onRequest(scriptContext) {
      if (scriptContext.request.method === 'GET') {
        scriptContext.response.writePage(buildForm());
      } else {
        try {
          let params = {
            name: scriptContext.request.parameters.custpage_name,
            email: scriptContext.request.parameters.custpage_email,
            subject: scriptContext.request.parameters.custpage_subject,
            message: scriptContext.request.parameters.custpage_message,
          };

          if (emailExists(params.email)) {
            scriptContext.response.writePage(buildForm('This email is already registered. Record not saved.', params));
          } else {
            createEnquiryRecord(params);
            scriptContext.response.write('Form Submitted Successfully.');
          }
        } catch (error) {
          log.error({ title: 'Form Submission Error', details: error });
          scriptContext.response.write('An error occurred. Please try again later.');
        }
      }
    }

    return {
      onRequest: onRequest
    };
  });
