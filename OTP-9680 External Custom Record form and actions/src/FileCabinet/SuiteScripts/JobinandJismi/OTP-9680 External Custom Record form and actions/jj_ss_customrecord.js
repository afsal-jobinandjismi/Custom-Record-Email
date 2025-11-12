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


define(['N/ui/serverWidget', 'N/record', 'N/log'],
  /**
  * Defines the Suitelet script trigger point.
  * @param {Object} scriptContext
  * @param {ServerRequest} scriptContext.request - Incoming request
  * @param {ServerResponse} scriptContext.response - Suitelet response
  * @since 2015.2
  * 
  * creates a custom form to capture customer data including name, email, subject, and message.
  * 
  */


  function (serverWidget, record, log) {

  /**
  * Defines the Suitelet script trigger point.
  * @param {Object} scriptContext
  * @param {ServerRequest} scriptContext.request - Incoming request
  * @param {ServerResponse} scriptContext.response - Suitelet response
  * @since 2015.2
  * Builds the custom form for capturing customer data.
  * 
  */


    function buildForm() {
      const form = serverWidget.createForm({ title: 'Customer Data' });

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

      form.addField({
        id: 'custpage_linked_customer',
        type: serverWidget.FieldType.SELECT,
        label: 'Customer (Reference)',
        source: 'customer'
      }).isMandatory = false;

      form.addSubmitButton({ label: 'Submit' });
      return form;
    }


  /**
  * Defines the Suitelet script trigger point.
  * @param {Object} scriptContext
  * @param {ServerRequest} scriptContext.request - Incoming request
  * @param {ServerResponse} scriptContext.response - Suitelet response
  * @since 2015.2
  * Creates a custom record to store the captured customer data.
  * 
  * 
  */




    function createEnquiryRecord(params) {
      try {
        const enquiry = record.create({
          type: 'customrecordjj_customerdata',
          isDynamic: true
        });

        enquiry.setValue({ fieldId: 'custrecordjj_customername', value: params.name });
        enquiry.setValue({ fieldId: 'custrecordjj_customeremail', value: params.email });
        enquiry.setValue({ fieldId: 'custrecordjj_subject', value: params.subject });
        enquiry.setValue({ fieldId: 'custrecordjj_message', value: params.message });

        if (params.customerreference) {
          enquiry.setValue({ fieldId: 'custrecordjj_reference', value: params.customerreference });
        }

        enquiry.save();
      } catch (error) {
        log.error({ title: 'Create Enquiry Error', details: error });
      }
    }

  /**
  * Defines the Suitelet script trigger point.
  * @param {Object} scriptContext
  * @param {ServerRequest} scriptContext.request - Incoming request
  * @param {ServerResponse} scriptContext.response - Suitelet response
  * @since 2015.2
  * Handles GET and POST requests for the Suitelet and processes form submissions.
  * 
  * 
  */


    function onRequest(context) {
      if (context.request.method === 'GET') {
        context.response.writePage(buildForm());
      } else {
        try {
          const params = {
            name: context.request.parameters.custpage_name,
            email: context.request.parameters.custpage_email,
            subject: context.request.parameters.custpage_subject,
            message: context.request.parameters.custpage_message,
            customerreference: context.request.parameters.custpage_linked_customer
          };

          createEnquiryRecord(params);
          context.response.write('Form Submitted Successfully.');
        } catch (error) {
          log.error({ title: 'Form Submission Error', details: error });
          context.response.write('An error occurred. Please try again later.');
        }
      }
    }

    return {
      onRequest: onRequest
    };
  });

