const dbConnection = require("../dbConnection");


module.exports = class CircuitDao {

    async getBranchesByCircuitName(circuitName) {
        let con = await dbConnection();
        try {
            let sql = "SELECT a.* FROM dnacp1.branch a , dnacp1.circuit b where a.CKT_ID = b.CKT_ID and a.BR_VRSN_TYP_CODE != 'ARC' and b.CLCI_ID_COMPRD = ? ";
            let result = await con.query(sql, [circuitName]);
            //let sql = "SELECT a.* FROM dnacp1.branch a , dnacp1.circuit b where a.CKT_ID = b.CKT_ID and a.BR_VRSN_TYP_CODE != 'ARC' and b.CLCI_ID_COMPRD ='" + circuitName + "'";
            //console.log(sql);
            //let result = await con.query(sql);
           
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