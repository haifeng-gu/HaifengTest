const dbConnection = require("../dbConnection");


module.exports = class ClrEntryDao {

    async getClrEntiresByBranch(queryObj) {
        let con = await dbConnection();
        try {
            let sql = "SELECT * FROM dnacp1.tlpentry where CKT_ID = " + queryObj.circuit + " and  BR_NODE_ID = '" + queryObj.brNode
                + "' and BR_ID = '" + queryObj.branch + "' and BR_VRSN_NO = " + queryObj.version + " order by TSTLP_SEQ_NO";

            let result = await con.query(sql);
            //result = JSON.parse(JSON.stringify(result));
            return result;
        } catch (ex) {
            console.log(ex);
            throw ex;
        } finally {
            await con.release();
            await con.destroy();
        }
    }


};