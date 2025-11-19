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

  /**
       * @param{serverWidget} serverWidget
       * @param{record} record
       * @param{search} search
       * @param{log} log
  */



  function (serverWidget, record, log, search) {


    /**
     * Builds a Suitelet form to capture customer data including name, email, subject, and message.
     * Optionally pre-populates fields with provided parameters and displays an error message if supplied.
     *
     * @function buildForm
     * @param {string} [errorMessage] - Optional error message to display on the form.
     * @param {Object} [params] - Optional default values for the form fields.
     * @param {string} [params.name] - Default value for the "Customer Name" field.
     * @param {string} [params.email] - Default value for the "Customer Email" field.
     * @param {string} [params.subject] - Default value for the "Subject" field.
     * @param {string} [params.message] - Default value for the "Message" field.
     * @returns {N/ui/serverWidget.Form} The created Suitelet form object.
     * @throws {Error} Logs and rethrows any error that occurs during form creation.
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
     * Checks if a customer email already exists in the custom record `customrecord_jj_customer_data`.
     *
     * @function emailExists
     * @param {string} email - The customer email address to search for.
     * @returns {boolean} True if the email exists in the record, false otherwise.
     * @throws {Error} Logs and returns false if the search fails due to an error.
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
     * Creates a new enquiry record in the custom record type `customrecord_jj_customer_data`.
     *
     * @function createEnquiryRecord
     * @param {Object} params - The customer enquiry details.
     * @param {string} params.name - Customer's name.
     * @param {string} params.email - Customer's email address.
     * @param {string} params.subject - Subject of the enquiry.
     * @param {string} params.message - Message content of the enquiry.
     * @returns {void} Does not return a value; saves the record in NetSuite.
     * @throws {Error} Logs and rethrows any error that occurs during record creation.
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
    * @throws {Error} Logs and handles any error that occurs during form submission
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
