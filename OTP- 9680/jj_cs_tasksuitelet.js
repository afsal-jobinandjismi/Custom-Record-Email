/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/log'], function(serverWidget, record, log) {
 
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
 
 