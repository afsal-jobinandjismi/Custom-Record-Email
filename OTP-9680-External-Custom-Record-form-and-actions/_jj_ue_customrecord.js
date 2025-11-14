/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
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
 * Description : This User event script allows to check whether a customer exist with given email id and 
 * if found customer will be linked to custom record and if there is an entry in custom record email is
 * send to admin and to corresponding sales rep if sales rep exist.
 * 
 * REVISION HISTORY
 *
 * @version 1.0 : 24-October-2025 :  The initial build was created by JJ0414
 * 
*************************************************************************************************/

define(['N/record', 'N/search', 'N/email', 'N/runtime', 'N/log'],

  /**
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the scriptContext.UserEventType enum
   * @since 2015.2
   
   * check whether a customer exist with given email id and 
   * if found customer will be linked to custom record and if there is an entry in custom record email is
   * send to admin and to corresponding sales rep if sales rep exist.
   */

  function (record, search, email, runtime, log) {
    let ADMIN_ID = -5;

    /**
     * Defines the function definition that is executed after record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the scriptContext.UserEventType enum
     * @since 2015.2
     * check whether a customer exist with given email id and 
     */


    function findCustomerByEmail(emailValue) {
      try {
        let customerSearch = search.create({
          type: search.Type.CUSTOMER,
          filters: [['email', 'is', emailValue]],
          columns: ['internalid', 'salesrep']
        });

        let result = customerSearch.run().getRange({ start: 0, end: 1 });
        return result.length > 0 ? result[0] : null;
      } catch (error) {
        log.error({ title: 'Customer Search Error', details: error });
        return null;
      }
    }

    /**
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the scriptContext.UserEventType enum
     * @since 2015.2
     * If a customer is found, link the custom record to the customer. 
     */


    function linkCustomerToEnquiry(enquiryId, customerId) {
      try {
        let enquiryRecord = record.load({
          type: 'customrecord_jj_customer_data',
          id: enquiryId,
          isDynamic: true
        });

        enquiryRecord.setValue({
          fieldId: 'custrecord_jj_reference',
          value: customerId
        });

        enquiryRecord.save();
      } catch (error) {
        log.error({ title: 'Linking Error', details: error });
      }
    }

    /**
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the scriptContext.UserEventType enum
     * @since 2015.2
     * Notify admin when a new enquiry is created.
     */


    function notifyAdmin(name, emailValue, subject, message) {
      try {
        email.send({
          author: runtime.getCurrentUser().id,
          recipients: ADMIN_ID,
          subject: 'New Customer Enquiry',
          body: `Dear Admin,

                 You have received a new customer enquiry. Please find the details below:

                 Customer Name: ${name}
                 Customer Email: ${emailValue}
                 Subject: ${subject}
                 Message: ${message}

                 Kindly follow up with the customer at your earliest convenience.

                 Best regards,
                 ${runtime.getCurrentUser().name}`
        });
      } catch (error) {
        log.error({ title: 'Admin Notification Error', details: error });
      }
    }

    /**
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the scriptContext.UserEventType enum
     * @since 2015.2
     * Notify the sales representative when a new enquiry is linked to their customer.
     */


    function notifySalesRep(salesRepId, name, emailValue, subject, message) {
      try {
        email.send({
          author: runtime.getCurrentUser().id,
          recipients: salesRepId,
          subject: 'Customer Enquiry Received',
          body: `Dear Sales Representative,

                 You have received a new customer enquiry. Please find the details below:

                 Customer Name: ${name}
                 Customer Email: ${emailValue}
                 Subject: ${subject}
                 Message: ${message}

                 Kindly follow up with the customer at your earliest convenience.

                Best regards,
                Administration Team`
        });
      } catch (error) {
        log.error({ title: 'Sales Rep Notification Error', details: error });
      }
    }

    /**
     * Defines the function definition that is executed after record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the scriptContext.UserEventType enum
     * @since 2015.2
     * Here we handle the afterSubmit event to process the custom record after it is created and link to customer if exist
     * and send notifications.
     */


    function afterSubmit(scriptContext) {
      if (scriptContext.type !== scriptContext.UserEventType.CREATE) return;

      try {
        let newRecord = scriptContext.newRecord;
        let emailValue = newRecord.getValue('custrecord_jj_customeremail');
        let nameValue = newRecord.getValue('custrecord_jj_customername');
        let subjectValue = newRecord.getValue('custrecord_jj_subject');
        let messageValue = newRecord.getValue('custrecord_jj_message');

        if (!emailValue) return;

        notifyAdmin(nameValue, emailValue, subjectValue, messageValue);

        let customer = findCustomerByEmail(emailValue);
        if (customer) {
          let customerId = customer.getValue('internalid');
          let salesRepId = customer.getValue('salesrep');

          linkCustomerToEnquiry(newRecord.id, customerId);

          if (salesRepId) {
            notifySalesRep(salesRepId, nameValue, emailValue, subjectValue, messageValue);
          }
        }
      } catch (error) {
        log.error({ title: 'afterSubmit Error', details: error });
      }
    }

    return {
      afterSubmit: afterSubmit
    };
  });

